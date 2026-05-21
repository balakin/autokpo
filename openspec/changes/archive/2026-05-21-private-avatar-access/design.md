## Context

Avatar images are served from R2 at `/avatars/{randomUUID}`. The endpoint is currently public — no session check. The UUID is unguessable, but "security by obscurity" is insufficient for GDPR: unauthenticated actors (bots, crawlers) can retrieve images if they obtain a URL.

Responses currently carry `Cache-Control: public, max-age=31536000, immutable`, which allows CDNs and browser HTTP caches to store avatar images. The browser HTTP cache cannot be cleared from JavaScript, meaning a logout cannot fully purge cached avatar data.

A Workbox service worker is already in place with a `CacheFirst` runtime cache for `/avatars/*` (cache name `'avatars'`). The Cache Storage API (`caches`) is accessible from the window context and can be used to delete the SW cache on logout.

## Goals / Non-Goals

**Goals:**

- Gate avatar GET behind authentication with per-user ownership verification
- Prevent browser HTTP caching of avatar responses so logout can fully clear all cached avatar data
- Clear the SW avatar cache on logout before signaling session removal to other tabs

**Non-Goals:**

- Changing how avatars are uploaded, imported, or deleted
- Invalidating avatars server-side (R2 keys rotate on every upload; old keys are deleted)
- Supporting avatar access for any user other than the owner (no sharing, no admin view)

## Decisions

### Decision: Ownership check, not just session presence

**Choice**: Verify `user.image = '/avatars/' + id` in the DB for the requesting user's ID.

**Rationale**: "Any valid session" would let authenticated users probe for avatars belonging to other accounts. Ownership verification aligns with GDPR's data minimization principle. The DB lookup is a single point read on the primary key; Workbox `CacheFirst` means it only happens once per URL per device.

**Alternative considered**: Session-only gate. Rejected — insufficient for GDPR; any logged-in user could access any avatar UUID.

### Decision: Return 404 (not 403) for non-owned avatars

**Choice**: When the requested UUID does not match the session user's `image`, return 404.

**Rationale**: A 403 would confirm that the UUID exists but belongs to someone else. A 404 leaks nothing about whether the R2 object exists at all.

### Decision: `Cache-Control: no-store` instead of `private`

**Choice**: Replace `public, max-age=31536000, immutable` with `no-store` on avatar GET responses.

**Rationale**: `private` allows browser HTTP caching, which cannot be cleared from JavaScript on logout. `no-store` prevents the browser HTTP cache from storing the response entirely. The Workbox Cache API ignores `no-store` when explicitly calling `cache.put()`, so SW caching is unaffected.

**Alternative considered**: `private, max-age=31536000`. Rejected — browser HTTP cache would survive logout.

### Decision: Clear SW cache before `writeStoredSession(null)`

**Choice**: In `logoutSession()`, call `await caches.delete('avatars')` before `writeStoredSession(null)`.

**Rationale**: `writeStoredSession(null)` fires a `storage` event that triggers UI unmount in other tabs. Clearing the cache first ensures it is gone before any tab reacts. The Cache Storage API is origin-level shared storage — one tab's `caches.delete('avatars')` clears it for all tabs and the SW.

**Alternative considered**: Clear cache after `writeStoredSession`. Rejected — race condition: other tabs could request an avatar in the window between session clear and cache clear.

## Risks / Trade-offs

**SW not yet active on first load** → Avatar `<img>` request bypasses SW and goes directly to the worker. Session cookie is sent automatically (same-origin). Auth check runs normally, response returns with `no-store`. No functional issue; the SW caches it on activation.

**Legacy browser HTTP cache entries** (from before this change, cached as `public, immutable`) → Will be served from browser HTTP cache until they expire (up to 1 year) or the browser cache is cleared. Mitigation: avatar URLs rotate on every upload (new UUID); only the exact old URL is affected, and that key is deleted from R2 anyway after upload.

**DB lookup on every cache miss** → Adds a D1 read to avatar GETs. Mitigated by Workbox `CacheFirst` — after the first hit, subsequent requests are served from SW cache with no network round-trip.

**`caches` API availability** → `CacheStorage` is available in all modern browsers in both window and SW contexts. If `caches` is undefined (very old browser), `caches.delete` would throw. Mitigation: wrap in `typeof caches !== 'undefined'` guard or let it fail silently — the user is still logged out.

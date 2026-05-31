## Context

AutoKPO is local-first: the app shell is precached, CRDT data is stored in IndexedDB, and sync can wait for network recovery. Authentication and E2EE currently add extra local persistence layers: session data is mirrored into `localStorage`, cross-tab session updates are propagated with `storage` events, and the encrypted key-ring profile plus password wrapper are cached in IndexedDB. The app is not released, so IndexedDB schema simplification does not require preserving existing user data.

The new direction is to make offline session/key-ring availability explicit at the service-worker boundary. The online server remains authoritative; offline mode may use the latest successful cached session and key-ring GET responses as last-known local identity and encrypted key-ring data.

## Goals / Non-Goals

**Goals:**

- Replace session `localStorage` persistence with an asynchronous auth/session gate backed by React Query and service-worker NetworkFirst runtime caching.
- Replace session `storage` event propagation with BroadcastChannel notifications for login and logout/session changes.
- Move encrypted key-ring offline fallback from app-owned IndexedDB key-ring/password-wrapper stores to a named service-worker runtime cache for `GET /api/e2ee/key-ring`.
- Keep IndexedDB E2EE persistence limited to local unlock wrappers/keys.
- Avoid duplicate key-ring GETs during gate check/unlock by using a shared React Query `fetchQuery` path with a short freshness window.
- Clear protected named runtime caches after successful online logout.

**Non-Goals:**

- Broadly cache all `/api/*` requests.
- Cache sync endpoints or alter sync conflict/revision semantics.
- Support offline logout; logout remains online-only for this change.
- Introduce IndexedDB migrations for the removed key-ring/password-wrapper stores.
- Treat cached offline session data as proof of current server authorization.

## Decisions

### Use exact NetworkFirst runtime caches for session and key-ring

The service worker will remove the deprecated avatar runtime cache and add named NetworkFirst caches only for:

- `/api/auth/get-session` (the Better Auth session read endpoint used by `authClient.getSession()`)
- `GET /api/e2ee/key-ring`

Both caches will store successful `200` responses only. This gives the desired behavior: when online, the network response wins and updates the cache; when offline, the most recent successful response may be returned. The design intentionally avoids `CacheFirst` and broad `/api/**` matching because auth and sync endpoints have different stale-data semantics.

Alternatives considered:

- **Browser HTTP cache only**: rejected because behavior is browser/header-dependent and not explicit.
- **Broad `/api/**` NetworkFirst\*\*: rejected because it may cache auth internals and sync responses with unsafe stale semantics.
- **Keep IndexedDB key-ring cache**: rejected because it preserves duplicate durable caches for the same encrypted server profile.

### Model cached session as offline local identity

The session query no longer bootstraps from `localStorage`. The `sessionQueryOptions` configure `staleTime: 5 min`, `networkMode: 'offlineFirst'`, and `retry: false`. Auth/session gates (`SignedInGate`, `SignedOutGate`, and the catch-all `AuthStateRedirect`) render null (loading) while `isPending` is true, and only redirect when the session query resolves. Online resolution comes from the server; offline resolution may come from the service-worker-cached session response.

Cached offline session data means “this browser recently had this local identity,” not “the server currently authorizes this session.” When the browser is online and the server returns no session, the app transitions to signed out and clears protected local residue.

### Use BroadcastChannel for session cross-tab propagation

`SessionSync` (rendered at the app root in `main.tsx`) serves as the cross-tab integration point, but stops listening to `storage` events. Login and logout/session changes broadcast a compact message via the `session-broadcast` module. Other tabs receive the message through `subscribeToSessionChanges`, invalidate/refetch or update their session query, and run the same user-boundary cleanup rules. This separates cross-tab notification from durable session storage.

### Drop remote key-ring/password-wrapper IndexedDB stores without migration

Because the app is unreleased, the E2EE IndexedDB database can be simplified directly. The `key_ring` and `wrapper` stores and their read/write/delete APIs are removed. The `local_wrapper` store remains and continues to hold LDK/PIN local unlock material keyed by `userId`.

The key-ring profile needed for unlock is fetched through the `keyRingProfileQueryOptions(userId)` shared query path. Durable offline fallback comes from the service-worker-cached `GET /api/e2ee/key-ring` response, and `cacheKeyRingProfile` seeds this cache after successful mutations.

### Share key-ring fetches through React Query

Gate checking, password unlock, conflict refresh, and password-change refresh use a shared `keyRingProfileQueryOptions(userId)` factory. The query key is scoped by userId (`['key-ring-profile', userId]`) and uses a short freshness window (five minutes), `networkMode: 'offlineFirst'`, and `retry: false`. A profile fetched during the gate check can be reused by unlock without a second network request.

After successful mutations (setup, unlock with new profile, password change), the `cacheKeyRingProfile` helper updates both the React Query cache and explicitly seeds the named service-worker runtime cache. This keeps the Workbox NetworkFirst fallback warm for offline use without waiting for the next GET to populate it.

### Clear protected runtime caches on logout

Named caches make cleanup explicit. After successful online logout, the `cleanupSignedOutSession` helper clears:

- auth session runtime cache
- E2EE key-ring runtime cache
- related React Query session/key-ring data via `clearQueryCacheOnSignOut`
- previous user's `local_wrapper`

The `useAuth.logout()` orchestrator calls `cleanupSignedOutSession(userId)` (which clears protected SW caches and local unlock material, then broadcasts null) followed by `clearQueryCacheOnSignOut(queryClient)` (which sets the session query to null and removes all non-session queries).

Non-200 session/key-ring responses are not cacheable, so an online failed/expired session response does not refresh the protected caches. Logout is restricted while offline for this change.

## Risks / Trade-offs

- **Risk: Async auth boot can redirect too early** → Add a session gate/loading state and update signed-in/signed-out gates plus catch-all routing to wait for resolved session state.
- **Risk: Service-worker caches are URL-keyed, not user-keyed** → Use separate named caches and clear them on logout. Validate key-ring profiles against the current session user before use. On user switch, the new user's session and key-ring fetches naturally overwrite the cached entries.
- **Risk: Stale offline session can outlive server expiry** → This is an intentional offline local-identity behavior; online NetworkFirst fetches remain authoritative and clear state when the server reports no session.
- **Risk: Key-ring cache not seeded after mutations** → Mitigated by `cacheKeyRingProfile`, which explicitly seeds both React Query and the protected service-worker runtime cache after setup, unlock, and password change.
- **Risk: Offline logout not available** → Explicitly keep logout online-only for this change.
- **Risk: Existing IndexedDB data is discarded** → Acceptable because the app is unreleased; no migration or compatibility path is required.

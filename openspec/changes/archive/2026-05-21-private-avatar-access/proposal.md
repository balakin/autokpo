## Why

Avatar images at `/avatars/{id}` are currently public — any unauthenticated request (bots, crawlers, anyone with the URL) can retrieve them. For GDPR compliance, profile images should be accessible only to the user who owns them.

## What Changes

- **GET `/avatars/:id`** requires a valid session and verifies the requested avatar belongs to the requesting user (ownership check); returns 401 if unauthenticated, 404 if the avatar does not belong to the session user
- **`Cache-Control`** on avatar responses changes from `public, max-age=31536000, immutable` to `no-store` — the browser HTTP cache never stores avatar images; only the service worker cache does
- **Logout** clears the SW `'avatars'` cache before writing the session removal to localStorage, ensuring no avatar data persists after sign-out

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `profile-images`: Serving requirement changes — avatar GET endpoint is now auth-gated with ownership verification, and the cache directive changes from public/immutable to no-store
- `pwa-offline`: Avatar runtime cache must be cleared on logout; offline avatar availability is bounded to the authenticated session

## Impact

- `apps/app/worker/routes/avatars.ts` — GET handler gains session + ownership check
- `apps/app/worker/avatar-storage.ts` — `IMMUTABLE_AVATAR_CACHE_CONTROL` constant replaced with `no-store`
- `apps/app/src/auth/auth-session.ts` — `logoutSession` clears the `'avatars'` SW cache before clearing localStorage
- Worker tests in `apps/app/worker/__tests__/avatars.spec.ts` need updating
- No changes to `vite.config.ts` — existing Workbox `CacheFirst` config for avatars is already correct

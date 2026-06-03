## Why

Offline state for the session and key-ring currently depends on Workbox `NetworkFirst` runtime caches in the service worker, which is unreliable: the SW may not be installed (first visit), not yet controlling the page (update cycle), or restricted by the platform (iOS Safari, incognito). When the SW cache is cold, a page reload while offline leaves the app without identity or encryption data. React Query's IDB persistence eliminates this dependency by restoring query data directly from IndexedDB before any network attempt.

## What Changes

- Add `@tanstack/react-query-persist-client` and configure `PersistQueryClientProvider` to persist the `session` and `key-ring-profile` queries to IndexedDB with a 60-day TTL (matching the server session lifetime).
- Remove the two Workbox `NetworkFirst` runtime cache entries for `/api/auth/get-session` and `/api/e2ee/key-ring`.
- Remove `networkMode: 'offlineFirst'` from both query option definitions — the default `'online'` mode is correct when data is restored from IDB rather than intercepted by the SW.
- Set `gcTime: 60 days` on both persisted queries so in-memory data outlives the session.
- Replace `clearProtectedCaches()` (CacheStorage deletion on sign-out) with `persister.removeClient()` (IDB deletion).
- Delete `sw-cache-names.ts`, `clear-protected-caches.ts`, and their tests — no longer needed.
- Remove the manual `putKeyRingProfileInProtectedCache` write from `key-ring-query.ts` — the persister handles IDB writes automatically on every cache update.

## Capabilities

### New Capabilities

- `query-offline-persistence`: React Query IDB persistence for session and key-ring queries — covers persister setup, query configuration, sign-out cleanup, and removal of the SW runtime cache layer.

### Modified Capabilities

- `offline-auth-runtime-cache`: All existing requirements replaced — SW NetworkFirst caching for session and key-ring endpoints is removed in favour of IDB persistence.
- `pwa-offline`: The "Protected API runtime caches are explicit" requirement is obsolete — no protected runtime caches remain after this change.

## Impact

- **Dependencies**: add `@tanstack/react-query-persist-client`
- **`src/main.tsx`**: `QueryClientProvider` → `PersistQueryClientProvider`
- **`src/pwa/`**: new `query-persister.ts`; delete `sw-cache-names.ts`, `clear-protected-caches.ts`, `__tests__/clear-protected-caches.spec.ts`
- **`src/auth/session-cleanup.ts`**: replaces `clearProtectedCaches()` with `persister.removeClient()`
- **`src/auth/use-session-query.ts`**: adds `gcTime`, removes `networkMode`
- **`src/e2ee/key-ring-query.ts`**: adds `gcTime`, removes `networkMode`, removes CacheStorage write
- **`apps/app/vite.config.ts`**: removes 2 `runtimeCaching` entries and associated imports

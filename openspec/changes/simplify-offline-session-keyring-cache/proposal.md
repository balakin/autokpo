## Why

The app currently keeps overlapping offline session and key-ring caches in `localStorage`, IndexedDB, React Query memory, and browser/service-worker caches. The E2EE gate already tolerates asynchronous startup, so we can simplify local persistence by relying on explicit service-worker runtime caches for offline session/key-ring fetches and keeping IndexedDB limited to local unlock material.

## What Changes

- Remove the deprecated `/avatars/*` service-worker runtime cache.
- Add explicit NetworkFirst service-worker runtime caches for `/api/auth/get-session` and `GET /api/e2ee/key-ring`.
- Treat online server responses as authoritative while allowing cached session/key-ring responses to enable local offline mode.
- Remove session persistence from `localStorage`; session loading becomes asynchronous and gated before signed-in/signed-out route decisions.
- Replace session cross-tab `storage` event propagation with BroadcastChannel notifications for login and logout/session changes.
- **BREAKING**: Drop IndexedDB persistence for remote encrypted key-ring records and password wrapper records; the app is unreleased, so no migration is required.
- Keep only local unlock wrappers/keys in the E2EE IndexedDB database.
- Fetch the key-ring profile through React Query (`keyRingProfileQueryOptions(userId)` with userId-scoped query key, five-minute freshness, `networkMode: 'offlineFirst'`) to avoid duplicate unlock-time GETs while retaining the service worker as the durable offline fallback. The `cacheKeyRingProfile` helper actively seeds both the React Query cache and the service-worker runtime cache after mutations.
- Clear named protected runtime caches after successful online logout.

## Capabilities

### New Capabilities

- `offline-auth-runtime-cache`: Defines service-worker runtime caching for authenticated session and key-ring reads that support offline local mode.

### Modified Capabilities

- `pwa-offline`: Remove the deprecated avatar runtime cache and specify protected API runtime cache behavior.
- `user-auth`: Replace remembered localStorage session bootstrapping and storage-event sync with an async auth gate (`SignedInGate`, `SignedOutGate`, `AuthStateRedirect`) and BroadcastChannel session notifications consumed by `SessionSync` at the app root.
- `e2ee-key-ring`: Move the encrypted key-ring/profile offline fallback from IndexedDB records to the service-worker-cached GET response and React Query fetch path.
- `local-device-key`: Update logout/local-wrapper expectations now that remote key-ring and wrapper IndexedDB records no longer exist.

## Impact

- Affects VitePWA Workbox runtime caching configuration.
- Affects auth session query, auth route gates, catch-all routing, login/logout flow, and cross-tab session sync.
- Affects E2EE IndexedDB schema and key-ring profile read/write/cache paths.
- Affects logout/auth-boundary cleanup for named service-worker caches and local unlock material.
- Requires tests for offline session/key-ring cache fallback, async auth gating, BroadcastChannel session propagation, and removal of avatar/key-ring IndexedDB caches.

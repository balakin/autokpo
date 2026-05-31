## 1. Service Worker Runtime Caches

- [x] 1.1 Remove the deprecated `/avatars/*` Workbox runtime cache from the VitePWA configuration.
- [x] 1.2 Add a named NetworkFirst runtime cache for the exact Better Auth session read endpoint used by `authClient.getSession()`.
- [x] 1.3 Add a named NetworkFirst runtime cache for `GET /api/e2ee/key-ring`.
- [x] 1.4 Ensure protected runtime caches store only `200` responses and do not cache `/api/sync` or broad `/api/auth/*` routes.
- [x] 1.5 Add a small helper for deleting the named auth-session and e2ee-key-ring service-worker caches.

## 2. Async Auth Session and Cross-Tab Sync

- [x] 2.1 Remove session `localStorage` read/write bootstrapping from the session query and auth-session utilities.
- [x] 2.2 Introduce or update the auth/session gate so signed-in and signed-out route gates show loading until the session query resolves.
- [x] 2.3 Update catch-all routing to wait for resolved session state instead of synchronously reading stored session state.
- [x] 2.4 Replace `SessionSync` storage-event handling with BroadcastChannel login/logout/session-change messages.
- [x] 2.5 Broadcast session changes after login/session refresh and successful logout, and make receiving tabs invalidate or update the session query.

## 3. Auth Boundary Cleanup

- [x] 3.1 Clear named protected runtime caches after successful online logout.
- [x] 3.2 Clear named protected runtime caches on login or resolved session user-id changes.
- [x] 3.3 Keep logout online-only and prevent offline logout from completing local cleanup as if remote sign-out succeeded.
- [x] 3.4 Continue clearing previous-user local encryption unlock material on auth loss or user change.
- [x] 3.5 Remove obsolete avatar-cache cleanup from logout/session cleanup paths.

## 4. E2EE IndexedDB Simplification

- [x] 4.1 Remove `key_ring` and `wrapper` IndexedDB object stores, schemas, and read/write/delete APIs.
- [x] 4.2 Keep `local_wrapper` support for both LDK and PIN records, including failed PIN attempt updates.
- [x] 4.3 Update `clearSessionData()` and related cleanup to delete only `local_wrapper` data.
- [x] 4.4 Remove code paths that persist remote key-ring or password-wrapper records to IndexedDB.

## 5. Shared Key-Ring Fetch Path

- [x] 5.1 Define shared React Query options for the key-ring profile with a bounded freshness window, e.g. five minutes.
- [x] 5.2 Use `queryClient.fetchQuery` for key-ring profile reads during encryption gate checking and password unlock.
- [x] 5.3 Ensure password-change and other key-ring-changing flows refetch through the shared GET path after successful mutation.
- [x] 5.4 Validate fetched/cached key-ring profiles against the current authenticated user before using them for unlock.
- [x] 5.5 Remove fallback unlock logic that reads remote key-ring/password-wrapper data from IndexedDB.

## 6. Tests and Verification

- [x] 6.1 Add or update tests for async auth gate loading and redirect behavior.
- [x] 6.2 Add or update tests for BroadcastChannel session propagation on login and logout/session changes.
- [x] 6.3 Add or update tests for protected runtime cache cleanup helper behavior.
- [x] 6.4 Add or update E2EE tests covering unlock via shared key-ring query and no remote key-ring IndexedDB persistence.
- [x] 6.5 Add or update PWA configuration tests/assertions for removing avatar cache and adding exact protected NetworkFirst caches.
- [x] 6.6 Run targeted tests for auth, E2EE, and PWA/cache behavior.
- [x] 6.7 Run the package build or typecheck to verify the implementation compiles.

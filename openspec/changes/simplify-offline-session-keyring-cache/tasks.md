## 1. Service Worker Runtime Caches

- [ ] 1.1 Remove the deprecated `/avatars/*` Workbox runtime cache from the VitePWA configuration.
- [ ] 1.2 Add a named NetworkFirst runtime cache for the exact Better Auth session read endpoint used by `authClient.getSession()`.
- [ ] 1.3 Add a named NetworkFirst runtime cache for `GET /api/e2ee/key-ring`.
- [ ] 1.4 Ensure protected runtime caches store only `200` responses and do not cache `/api/sync` or broad `/api/auth/*` routes.
- [ ] 1.5 Add a small helper for deleting the named auth-session and e2ee-key-ring service-worker caches.

## 2. Async Auth Session and Cross-Tab Sync

- [ ] 2.1 Remove session `localStorage` read/write bootstrapping from the session query and auth-session utilities.
- [ ] 2.2 Introduce or update the auth/session gate so signed-in and signed-out route gates show loading until the session query resolves.
- [ ] 2.3 Update catch-all routing to wait for resolved session state instead of synchronously reading stored session state.
- [ ] 2.4 Replace `SessionSync` storage-event handling with BroadcastChannel login/logout/session-change messages.
- [ ] 2.5 Broadcast session changes after login/session refresh and successful logout, and make receiving tabs invalidate or update the session query.

## 3. Auth Boundary Cleanup

- [ ] 3.1 Clear named protected runtime caches after successful online logout.
- [ ] 3.2 Clear named protected runtime caches on login or resolved session user-id changes.
- [ ] 3.3 Keep logout online-only and prevent offline logout from completing local cleanup as if remote sign-out succeeded.
- [ ] 3.4 Continue clearing previous-user local encryption unlock material on auth loss or user change.
- [ ] 3.5 Remove obsolete avatar-cache cleanup from logout/session cleanup paths.

## 4. E2EE IndexedDB Simplification

- [ ] 4.1 Remove `key_ring` and `wrapper` IndexedDB object stores, schemas, and read/write/delete APIs.
- [ ] 4.2 Keep `local_wrapper` support for both LDK and PIN records, including failed PIN attempt updates.
- [ ] 4.3 Update `clearSessionData()` and related cleanup to delete only `local_wrapper` data.
- [ ] 4.4 Remove code paths that persist remote key-ring or password-wrapper records to IndexedDB.

## 5. Shared Key-Ring Fetch Path

- [ ] 5.1 Define shared React Query options for the key-ring profile with a bounded freshness window, e.g. five minutes.
- [ ] 5.2 Use `queryClient.fetchQuery` for key-ring profile reads during encryption gate checking and password unlock.
- [ ] 5.3 Ensure password-change and other key-ring-changing flows refetch through the shared GET path after successful mutation.
- [ ] 5.4 Validate fetched/cached key-ring profiles against the current authenticated user before using them for unlock.
- [ ] 5.5 Remove fallback unlock logic that reads remote key-ring/password-wrapper data from IndexedDB.

## 6. Tests and Verification

- [ ] 6.1 Add or update tests for async auth gate loading and redirect behavior.
- [ ] 6.2 Add or update tests for BroadcastChannel session propagation on login and logout/session changes.
- [ ] 6.3 Add or update tests for protected runtime cache cleanup helper behavior.
- [ ] 6.4 Add or update E2EE tests covering unlock via shared key-ring query and no remote key-ring IndexedDB persistence.
- [ ] 6.5 Add or update PWA configuration tests/assertions for removing avatar cache and adding exact protected NetworkFirst caches.
- [ ] 6.6 Run targeted tests for auth, E2EE, and PWA/cache behavior.
- [ ] 6.7 Run the package build or typecheck to verify the implementation compiles.

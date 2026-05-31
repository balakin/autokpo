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
- Clear protected named runtime caches after successful online logout and on login/user-boundary changes.

**Non-Goals:**

- Broadly cache all `/api/*` requests.
- Cache sync endpoints or alter sync conflict/revision semantics.
- Support offline logout; logout remains online-only for this change.
- Introduce IndexedDB migrations for the removed key-ring/password-wrapper stores.
- Treat cached offline session data as proof of current server authorization.

## Decisions

### Use exact NetworkFirst runtime caches for session and key-ring

The service worker will remove the deprecated avatar runtime cache and add named NetworkFirst caches only for:

- the exact Better Auth session read endpoint used by `authClient.getSession()`
- `GET /api/e2ee/key-ring`

Both caches will store successful `200` responses only. This gives the desired behavior: when online, the network response wins and updates the cache; when offline, the most recent successful response may be returned. The design intentionally avoids `CacheFirst` and broad `/api/**` matching because auth and sync endpoints have different stale-data semantics.

Alternatives considered:

- **Browser HTTP cache only**: rejected because behavior is browser/header-dependent and not explicit.
- **Broad `/api/**` NetworkFirst\*\*: rejected because it may cache auth internals and sync responses with unsafe stale semantics.
- **Keep IndexedDB key-ring cache**: rejected because it preserves duplicate durable caches for the same encrypted server profile.

### Model cached session as offline local identity

The session query will no longer bootstrap from `localStorage`. A new auth/session gate will render a loading state until the session query resolves. Online resolution comes from the server; offline resolution may come from the service-worker-cached session response. Signed-in and signed-out route gates must not redirect until the session state is known.

Cached offline session data means “this browser recently had this local identity,” not “the server currently authorizes this session.” When the browser is online and the server returns no session, the app transitions to signed out and clears protected local residue.

### Use BroadcastChannel for session cross-tab propagation

SessionSync remains the cross-tab integration point, but it stops listening to `storage` events. Login and logout/session changes broadcast a compact message. Other tabs invalidate/refetch or update their session query and run the same user-boundary cleanup rules. This separates cross-tab notification from durable session storage.

### Drop remote key-ring/password-wrapper IndexedDB stores without migration

Because the app is unreleased, the E2EE IndexedDB database can be simplified directly. The `key_ring` and `wrapper` stores and their read/write/delete APIs are removed. The `local_wrapper` store remains and continues to hold LDK/PIN local unlock material keyed by `userId`.

The key-ring profile needed for unlock is fetched through the shared query path. Durable offline fallback comes from the service-worker-cached `GET /api/e2ee/key-ring` response.

### Share key-ring fetches through React Query

Gate checking, password unlock, conflict refresh, and password-change refresh use a shared key-ring profile query. The query has a short freshness window, e.g. five minutes, so a profile fetched during the gate check can be reused by unlock without a second network request. The service-worker NetworkFirst cache remains the durable fallback after reload/offline.

Key-ring-changing flows must continue to refresh the key-ring profile through the GET path so both React Query and the service-worker cache observe the latest active wrapper/profile.

### Clear protected runtime caches on auth boundaries

Named caches make cleanup explicit. After successful online logout, and on login/session user changes, the app clears:

- auth session runtime cache
- E2EE key-ring runtime cache
- related React Query session/key-ring data
- previous user's `local_wrapper`

Non-200 session/key-ring responses are not cacheable, so an online failed/expired session response does not refresh the protected caches. Logout is restricted while offline for this change.

## Risks / Trade-offs

- **Risk: Async auth boot can redirect too early** → Add a session gate/loading state and update signed-in/signed-out gates plus catch-all routing to wait for resolved session state.
- **Risk: Service-worker caches are URL-keyed, not user-keyed** → Use separate named caches, clear them on login/logout/user-boundary changes, and validate key-ring profiles against the current session user before use.
- **Risk: Stale offline session can outlive server expiry** → This is an intentional offline local-identity behavior; online NetworkFirst fetches remain authoritative and clear state when the server reports no session.
- **Risk: Key-ring cache not seeded after mutations** → Keep/refine the existing post-password-change key-ring refetch path and require key-ring-changing flows to refresh through the GET path.
- **Risk: Offline logout not available** → Explicitly keep logout online-only for this change.
- **Risk: Existing IndexedDB data is discarded** → Acceptable because the app is unreleased; no migration or compatibility path is required.

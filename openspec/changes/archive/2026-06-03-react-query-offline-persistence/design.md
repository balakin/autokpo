## Context

Offline data availability for the session and key-ring has relied on two Workbox `NetworkFirst` runtime caches in the service worker. When the SW is not yet active (first visit, update cycle, iOS PWA), the `queryFn` for both queries reaches the network, fails offline, and the app has no identity or encryption data to work with.

Both queries currently carry `networkMode: 'offlineFirst'` so the `queryFn` fires even offline — this was intentional: the SW was supposed to intercept and return the cached response. Without a reliable SW, the fetch simply fails.

React Query v5 ships a persistence layer (`@tanstack/react-query-persist-client`) that serialises dehydrated query data to any async storage and restores it on the next page load before queries fire. This is a direct, SW-independent solution to the problem.

The existing IDB utilities at `src/indexeddb/idb.ts` already provide the primitives needed to build the persister (`openDatabase`, `withStore`, `requestToPromise`) — no additional IDB library is required.

## Goals / Non-Goals

**Goals:**

- Session and key-ring data survive a page reload while offline, regardless of SW state.
- Persisted data is automatically cleared on sign-out.
- No new third-party IDB dependency; use existing `src/indexeddb/idb.ts`.
- Remove all SW runtime caching for API data (only asset precaching remains).

**Non-Goals:**

- Persisting any query beyond `session` and `key-ring-profile` — the CRDT store handles all app data separately.
- Encrypting the IDB persisted data — the key-ring profile is already server-encrypted ciphertext; the session data contains only userId, email, and sessionId (same exposure as the existing CacheStorage entry).
- Offline write support — persistence is read-only fallback; mutations require connectivity.

## Decisions

### Decision: Use `PersistQueryClientProvider` with selective dehydration

`@tanstack/react-query-persist-client` exports `PersistQueryClientProvider`, which wraps `QueryClientProvider`, delays query execution until IDB restoration completes, and subscribes to cache changes to write updates automatically. Selective dehydration via `shouldDehydrateQuery` ensures only the two target queries are persisted.

**Alternative considered**: Manual `persistQueryClientSubscribe` without the provider wrapper. Rejected: the provider's hydration-gate (keeping queries `idle` until restoration resolves) avoids a race where components try to use stale query state before IDB data is loaded.

### Decision: Build the IDB persister from `src/indexeddb/idb.ts`

The persister interface is three methods (`persistClient`, `restoreClient`, `removeClient`). The existing `openDatabase`/`withStore`/`requestToPromise` utilities cover this with a single object store keyed by a constant string. No `idb-keyval` or other library needed.

**Alternative considered**: `@tanstack/query-async-storage-persister` with a hand-rolled async storage adapter. Rejected: indirection without benefit — the raw IDB API via existing utils is simpler.

### Decision: Encapsulate in `src/query-client/` module

The persister, the `QueryClient` instance, and `PersistQueryClientProvider` wiring all belong together. A dedicated `src/query-client/` module owns all three:

- `query-persister.ts` — IDB persister singleton + `clearQueriesCache()` export
- `query-client.tsx` — zero-prop `QueryClientProvider` wrapper that encapsulates `new QueryClient()` and `PersistQueryClientProvider` setup
- `index.ts` — barrel exporting `QueryClientProvider` and `clearQueriesCache`

`session-cleanup.ts` imports `clearQueriesCache` from the barrel; `main.tsx` imports the zero-prop `QueryClientProvider`. Neither caller references the persister directly.

### Decision: `SESSION_LIFETIME_MS` constant

The 60-day value is used in three places: `gcTime` on both queries and `maxAge` in `PersistQueryClientProvider`. A single `SESSION_LIFETIME_MS` constant in `src/constants.ts` keeps them in sync and names the intent.

### Decision: `gcTime: 60 days` on the two persisted queries only

The session `expiresIn` is 60 days (server-side). `gcTime` must be >= `maxAge` to ensure restored data is not garbage-collected from memory before components subscribe. Setting `gcTime` only on the two persisted queries avoids inflating memory retention for all other queries.

### Decision: Remove `networkMode: 'offlineFirst'`

`offlineFirst` existed solely to let the SW intercept the fetch and return a cached response. With IDB persistence, the default `'online'` mode is correct: when offline, React Query pauses the fetch (`fetchStatus: 'paused'`), the restored data is shown as `status: 'success'`, and the refetch runs when connectivity returns.

### Decision: `maxAge: 60 days`, no `buster`

`maxAge` is set to match the session lifetime. No `buster` is used: the data shapes (session and key-ring profile) are structurally stable, and tying `buster` to `__APP_VERSION__` would force a cold start on every deploy, defeating the purpose of offline persistence.

### Decision: Remove SW runtime caching entirely for API data

The two `runtimeCaching` Workbox entries, `sw-cache-names.ts`, `clear-protected-caches.ts`, and the manual `putKeyRingProfileInProtectedCache` write are all deleted. Belt-and-suspenders SW caching would reintroduce complexity and a second source of truth. One mechanism (IDB) is simpler and more reliable across all platforms.

## Risks / Trade-offs

**Risk: IDB unavailable (private browsing on some browsers)**
→ The persister's `restoreClient` will fail; `PersistQueryClientProvider` falls back gracefully (queries behave as if there is no persisted cache — normal online behaviour). No user-visible breakage.

**Risk: Stale persisted data shown briefly before refetch**
→ `staleTime: 5 min` remains unchanged; the restored data is immediately considered stale and a background refetch is triggered on next focus or mount. This is the standard React Query stale-while-revalidate pattern and is intentional.

**Risk: IDB write throttle on high-frequency cache updates**
→ The tanstack persister throttles writes to once per second. Session and key-ring data change rarely (on login and key rotation), so this is a non-issue.

**Risk: `clearQueriesCache` fails during sign-out**
→ `clearQueriesCache` is called without a try/catch in `session-cleanup.ts`. An IDB failure will cause `cleanupSignedOutSession` to reject and the sign-out flow to surface an error. In practice, IDB is available in all supported browsers; the risk is accepted.

## Migration Plan

1. Install `@tanstack/react-query-persist-client`.
2. Add `SESSION_LIFETIME_MS` to `src/constants.ts`.
3. Create `src/query-client/` module:
   - `query-persister.ts` — IDB persister singleton + `clearQueriesCache()` export
   - `query-client.tsx` — zero-prop `QueryClientProvider` wrapping `PersistQueryClientProvider` with selective dehydration for `session` and `key-ring-profile`; uses `SESSION_LIFETIME_MS` for `maxAge`
   - `index.ts` — barrel
4. Update `main.tsx` to import `QueryClientProvider` from `./query-client`; remove inline `new QueryClient()`.
5. Update `sessionQueryOptions` and `keyRingProfileQueryOptions` (add `gcTime: SESSION_LIFETIME_MS`, remove `networkMode`); export `KEY_RING_PROFILE_QUERY_KEY` from `key-ring-query.ts`.
6. Update `session-cleanup.ts` to call `clearQueriesCache()` from `../query-client`.
7. Simplify `cacheKeyRingProfile` to only `setQueryData` (sync, no await).
8. Remove the two `runtimeCaching` entries from `vite.config.ts`.
9. Delete `sw-cache-names.ts`, `clear-protected-caches.ts`, and their tests.

No data migration needed — existing CacheStorage entries are simply abandoned; they expire naturally or are cleared by the browser.

## Open Questions

None — all decisions above are resolved based on the exploration session.

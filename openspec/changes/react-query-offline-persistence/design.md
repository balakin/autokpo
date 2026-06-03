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

### Decision: Persister as a module singleton

`session-cleanup.ts` is called from both React (hook) and non-React (plain async) contexts. Threading the persister through function parameters would require changing both call sites. A module-level singleton (`export const queryPersister = createQueryPersister()`) imported by both `main.tsx` and `session-cleanup.ts` is idiomatic and matches how other singleton resources (auth client) are handled in this codebase.

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

**Risk: `removeClient` silently fails during sign-out**
→ The persister's `removeClient` is wrapped in try/catch in `session-cleanup.ts`. A failed IDB clear means the next page load restores the old user's data, but the in-memory query cache is cleared by `clearQueryCacheOnSignOut`, so the app will refetch and discover the session is invalid. The stale IDB entry is overwritten on next successful sign-in.

## Migration Plan

1. Install `@tanstack/react-query-persist-client`.
2. Create `src/pwa/query-persister.ts` with the IDB persister singleton.
3. Swap `QueryClientProvider` for `PersistQueryClientProvider` in `main.tsx`.
4. Update `sessionQueryOptions` and `keyRingProfileQueryOptions` (add `gcTime`, remove `networkMode`).
5. Update `session-cleanup.ts` to call `queryPersister.removeClient()`.
6. Simplify `cacheKeyRingProfile` to only `setQueryData`.
7. Remove the two `runtimeCaching` entries from `vite.config.ts`.
8. Delete `sw-cache-names.ts`, `clear-protected-caches.ts`, and their tests.

No data migration needed — existing CacheStorage entries are simply abandoned; they expire naturally or are cleared by the browser.

## Open Questions

None — all decisions above are resolved based on the exploration session.

## 1. Install dependency

- [x] 1.1 Add `@tanstack/react-query-persist-client` to `apps/app/package.json` and install

## 2. IDB persister and query-client module

- [x] 2.1 Add `SESSION_LIFETIME_MS = 60 * 24 * 60 * 60 * 1000` to `src/constants.ts`
- [x] 2.2 Create `src/query-client/query-persister.ts`: implement `createQueryPersister()` using `openDatabase`/`withStore`/`requestToPromise` from `src/indexeddb/idb.ts` with a single object store (`'query-cache'`) keyed by `'cache'`; `restoreClient` returns `undefined` when `navigator.onLine`; export `queryPersister` singleton and `clearQueriesCache()` helper
- [x] 2.3 Create `src/query-client/query-client.tsx`: zero-prop `QueryClientProvider` wrapping `PersistQueryClientProvider`; `persistOptions` uses `queryPersister`, `maxAge: SESSION_LIFETIME_MS`, and `shouldDehydrateQuery` filtering to `session` and `key-ring-profile` keys
- [x] 2.4 Create `src/query-client/index.ts`: barrel exporting `QueryClientProvider` and `clearQueriesCache`
- [x] 2.5 Add tests for the persister in `src/query-client/__tests__/query-persister.spec.ts` (persist, restore, remove — use `fake-indexeddb`)

## 3. Query options — gcTime and networkMode

- [x] 3.1 In `src/auth/use-session-query.ts`: add `gcTime: SESSION_LIFETIME_MS`, remove `networkMode: 'offlineFirst'`
- [x] 3.2 In `src/e2ee/key-ring-query.ts`: add `gcTime: SESSION_LIFETIME_MS`, remove `networkMode: 'offlineFirst'`; export `KEY_RING_PROFILE_QUERY_KEY = 'key-ring-profile' as const`

## 4. Wire QueryClientProvider in main.tsx

- [x] 4.1 In `src/main.tsx`: import zero-prop `QueryClientProvider` from `./query-client`; remove `@tanstack/react-query` import and inline `new QueryClient()`

## 5. Sign-out cleanup

- [x] 5.1 In `src/auth/session-cleanup.ts`: replace `clearProtectedCaches()` with `clearQueriesCache()` from `../query-client`; remove `clearProtectedCaches` import
- [x] 5.2 Update `src/auth/__tests__/session-sync.spec.tsx` and any tests that mock or assert `clearProtectedCaches` behaviour

## 6. Remove CacheStorage write from key-ring-query

- [x] 6.1 In `src/e2ee/key-ring-query.ts`: remove `putKeyRingProfileInProtectedCache` function and its `caches` usage; simplify `cacheKeyRingProfile` to synchronous `queryClient.setQueryData(...)` (no `async`/`await`); remove `E2EE_KEY_RING_CACHE_NAME` import
- [x] 6.2 Update `src/e2ee/__tests__/key-ring-query.spec.ts` to remove assertions on CacheStorage writes

## 7. Remove SW runtime caching

- [x] 7.1 In `apps/app/vite.config.ts`: delete the two `runtimeCaching` entries for `/api/auth/get-session` and `/api/e2ee/key-ring`; remove imports of `AUTH_SESSION_CACHE_NAME` and `E2EE_KEY_RING_CACHE_NAME`

## 8. Delete obsolete modules

- [x] 8.1 Delete `src/pwa/sw-cache-names.ts`
- [x] 8.2 Delete `src/pwa/clear-protected-caches.ts`
- [x] 8.3 Delete `src/pwa/__tests__/clear-protected-caches.spec.ts`

## 9. Verify

- [x] 9.1 Run `cd apps/app && pnpm -s test --reporter=verbose | tail -n 120` — all tests pass
- [x] 9.2 Run `cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 40` — no type errors

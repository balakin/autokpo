## 1. Install dependency

- [x] 1.1 Add `@tanstack/react-query-persist-client` to `apps/app/package.json` and install

## 2. IDB persister

- [x] 2.1 Create `src/pwa/query-persister.ts`: implement `createQueryPersister()` using `openDatabase`/`withStore`/`requestToPromise` from `src/indexeddb/idb.ts` with a single object store keyed by `'cache'`; export `queryPersister` singleton
- [x] 2.2 Add tests for the persister in `src/pwa/__tests__/query-persister.spec.ts` (persist, restore, remove — use `fake-indexeddb`)

## 3. Query options — gcTime and networkMode

- [x] 3.1 In `src/auth/use-session-query.ts`: add `gcTime: 60 * 24 * 60 * 60 * 1000`, remove `networkMode: 'offlineFirst'`
- [x] 3.2 In `src/e2ee/key-ring-query.ts`: add `gcTime: 60 * 24 * 60 * 60 * 1000`, remove `networkMode: 'offlineFirst'`

## 4. Wire PersistQueryClientProvider in main.tsx

- [x] 4.1 Replace `QueryClientProvider` with `PersistQueryClientProvider` from `@tanstack/react-query-persist-client`; configure `persistOptions` with `persister: queryPersister`, `maxAge: 60 * 24 * 60 * 60 * 1000`, and `dehydrateOptions.shouldDehydrateQuery` filtering to `session` and `key-ring-profile` query keys

## 5. Sign-out cleanup

- [x] 5.1 In `src/auth/session-cleanup.ts`: replace `clearProtectedCaches()` with `queryPersister.removeClient()` (wrapped in try/catch so IDB failure does not abort the sign-out flow); remove `clearProtectedCaches` import
- [x] 5.2 Update `src/auth/__tests__/session-sync.spec.tsx` and any tests that mock or assert `clearProtectedCaches` behaviour

## 6. Remove CacheStorage write from key-ring-query

- [x] 6.1 In `src/e2ee/key-ring-query.ts`: remove `putKeyRingProfileInProtectedCache` function and its `caches` usage; simplify `cacheKeyRingProfile` to only `queryClient.setQueryData(...)`; remove `E2EE_KEY_RING_CACHE_NAME` import
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

## 1. Session Query Foundation

- [x] 1.1 Create `src/auth/use-session-query.ts` — `queryKey: ['session']`, `queryFn: authClient.getSession()`, `networkMode: 'offlineFirst'`, `initialData: readStoredSession`, `staleTime: 5 * 60 * 1000`, `retry: false` (queryFn has side effects: writes localStorage, clears encryption material); query side-effect writes updated session to localStorage on success
- [x] 1.2 Create `src/auth/session-sync.tsx` — `SessionSync` component that mounts a `window.storage` event listener; handler reads current cache value, compares userIds, calls `clearLocalEncryptionUnlockMaterial` if user changed, then writes new session via `queryClient.setQueryData`; returns `null`

## 2. Replace AuthProvider

- [x] 2.1 Rewrite `src/auth/use-auth.ts` as a pure hook: `user` from `useSessionQuery().data`, `logout` mutation (calls `logoutSession()` then `queryClient.setQueryData(['session'], null)`), `refresh` using `queryClient.fetchQuery({ queryKey: ['session'], staleTime: 0 })` returning the userId
- [x] 2.2 Remove `AuthProvider` from `src/main.tsx`; mount `SessionSync` in the appropriate app shell component
- [x] 2.3 Delete `src/auth/auth-provider.tsx`
- [x] 2.4 Delete `src/auth/auth-context.ts`

## 3. Update OAuth Callback

- [x] 3.1 Update `src/auth/oauth-callback.tsx` — replace `refreshSession()` call with `queryClient.fetchQuery({ queryKey: SESSION_QUERY_KEY, staleTime: 0 })` directly (not `auth.refresh()` — avoids dep-array instability since `auth` is a new object each render); put `queryClient` in the `useEffect` deps (stable ref)

## 4. Simplify Session Consumers

- [x] 4.1 Update `src/settings/account-settings-api.ts` — `fetchAccountProfile(queryClient)` reads from `queryClient.getQueryData(SESSION_QUERY_KEY)` instead of calling `authClient.getSession`; `fetchAccountSessions(queryClient)` uses `queryClient.fetchQuery(SESSION_QUERY_KEY, { staleTime: 5*60*1000 })` (not `getQueryData` — handles timing) for current session token; update `AccountSettingsPage` to pass `queryClient` to both functions
- [x] 4.2 Update `src/settings/export.ts` — remove `disableCookieCache: true` only; keep `authClient.getSession()` call (`emailVerified` and `createdAt` are not available in the session cache)

## 5. Cleanup

- [x] 5.1 Delete `refreshSession()` from `src/auth/auth-session.ts`; remove any now-unused imports
- [x] 5.2 Run tests and fix any breakage (`cd apps/app && pnpm -s test --reporter=verbose | tail -n 120`)
- [x] 5.3 Run type check and fix errors (`cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 40`)

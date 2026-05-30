## 1. Session Query Foundation

- [ ] 1.1 Create `src/auth/use-session-query.ts` — `queryKey: ['session']`, `queryFn: authClient.getSession()`, `networkMode: 'offlineFirst'`, `initialData: readStoredSession`, `staleTime: 5 * 60 * 1000`; query side-effect writes updated session to localStorage on success
- [ ] 1.2 Create `src/auth/session-sync.tsx` — `SessionSync` component that mounts a `window.storage` event listener, writes cross-tab session changes into the `['session']` RQ cache via `queryClient.setQueryData`, returns `null`

## 2. Replace AuthProvider

- [ ] 2.1 Rewrite `src/auth/use-auth.ts` as a pure hook: `user` from `useSessionQuery().data`, `logout` mutation (calls `logoutSession()` then `queryClient.setQueryData(['session'], null)`), `refresh` using `queryClient.fetchQuery({ queryKey: ['session'], staleTime: 0 })` returning the userId
- [ ] 2.2 Remove `AuthProvider` from `src/main.tsx`; mount `SessionSync` in the appropriate app shell component
- [ ] 2.3 Delete `src/auth/auth-provider.tsx`
- [ ] 2.4 Delete `src/auth/auth-context.ts`

## 3. Update OAuth Callback

- [ ] 3.1 Update `src/auth/oauth-callback.tsx` — replace `refreshSession()` call with `auth.refresh()` (which uses `fetchQuery` under the hood); update error handling to check returned userId instead of `refreshSession()` return value

## 4. Simplify Session Consumers

- [ ] 4.1 Update `src/settings/account-settings-api.ts` — `fetchAccountProfile` reads from `queryClient.getQueryData(['session'])` instead of calling `authClient.getSession`; `fetchAccountSessions` drops its `getSession` call and reads current session token from cache
- [ ] 4.2 Update `src/settings/export.ts` — drop `authClient.getSession` call, read session from `queryClient.getQueryData(['session'])`

## 5. Cleanup

- [ ] 5.1 Delete `refreshSession()` from `src/auth/auth-session.ts`; remove any now-unused imports
- [ ] 5.2 Run tests and fix any breakage (`cd apps/app && pnpm -s test --reporter=verbose | tail -n 120`)
- [ ] 5.3 Run type check and fix errors (`cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 40`)

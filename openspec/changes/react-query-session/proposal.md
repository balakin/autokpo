## Why

Multiple parts of the app call `authClient.getSession()` independently — `AuthProvider` on mount, `fetchAccountProfile`, `fetchAccountSessions`, and `export.ts` — resulting in redundant network requests. Routing all session access through a shared React Query key eliminates the duplication and gives deduplication, caching, and offline-first behavior for free.

## What Changes

- **New** `use-session-query.ts` hook — wraps `authClient.getSession()` with `queryKey: ['session']`, `networkMode: 'offlineFirst'`, and `initialData` from `readStoredSession()` (preserves synchronous offline-first startup)
- **New** `SessionSync` component — mounts a `window.storage` event listener that writes cross-tab session changes into the React Query cache; returns `null` (same pattern as `SyncEngine`)
- **Rewrite** `use-auth.ts` — becomes a pure hook; `user` from session query, `logout` as a mutation, `refresh` via `queryClient.invalidateQueries`; public API unchanged
- **Delete** `auth-provider.tsx` and `auth-context.ts` — React Query cache replaces the shared-state role of the context
- **Delete** `refreshSession()` from `auth-session.ts` — replaced by session query invalidation; OAuth callback updated accordingly
- **Simplify** `account-settings-api.ts` — `fetchAccountProfile` reads from `['session']` cache; `fetchAccountSessions` drops its redundant `getSession` call
- **Simplify** `export.ts` — drops its `getSession` call, reads from cache

## Capabilities

### New Capabilities

- none — this is an internal refactor; no new user-facing capabilities are introduced

### Modified Capabilities

- `user-auth`: OAuth callback currently calls `refreshSession()` directly; will be updated to use session query invalidation instead

## Impact

- `auth-provider.tsx`, `auth-context.ts` deleted — `QueryClientProvider` (already in `main.tsx`) is the only provider needed
- `SessionSync` component needs a mount point in the app shell (alongside `SyncEngine`)
- All 9 `useAuth()` consumers unchanged — hook API stays identical
- `disableCookieCache: true` removed from all `getSession` calls — acceptable, cookie cache `maxAge` is short and stale profile data on the settings page is not a concern

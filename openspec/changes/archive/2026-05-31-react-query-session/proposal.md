## Why

Multiple parts of the app call `authClient.getSession()` independently — `AuthProvider` on mount, `fetchAccountProfile`, `fetchAccountSessions`, and `export.ts` — resulting in redundant network requests. Routing all session access through a shared React Query key eliminates the duplication and gives deduplication, caching, and offline-first behavior for free.

## What Changes

- **New** `use-session-query.ts` hook — wraps `authClient.getSession()` with `queryKey: ['session']`, `networkMode: 'offlineFirst'`, and `initialData` from `readStoredSession()` (preserves synchronous offline-first startup)
- **New** `SessionSync` component — mounts a `window.storage` event listener that writes cross-tab session changes into the React Query cache; returns `null` (same pattern as `SyncEngine`)
- **Rewrite** `use-auth.ts` — becomes a pure hook; `user` from session query, `logout` as a mutation, `refresh` via `queryClient.fetchQuery({ staleTime: 0 })` returning the userId; public API unchanged
- **Delete** `auth-provider.tsx` and `auth-context.ts` — React Query cache replaces the shared-state role of the context
- **Delete** `refreshSession()` from `auth-session.ts` — replaced by session query invalidation; OAuth callback updated accordingly
- **Delete** `fetchAccountProfile` from `account-settings-api.ts` — account settings page reads profile data from `auth.user` (session query) directly; `AccountProfile` interface removed; `fetchAccountSessions` drops its parallel `getSession` call and the `isCurrent` field
- **Simplify** `export.ts` — removes `disableCookieCache: true` from the `getSession` call; keeps `getSession()` because `emailVerified` and `createdAt` are not available in the session cache

## Capabilities

### New Capabilities

- none — this is an internal refactor; no new user-facing capabilities are introduced

### Modified Capabilities

- `user-auth`: OAuth callback currently calls `refreshSession()` directly; will be updated to use session query invalidation instead

## Impact

- `auth-provider.tsx`, `auth-context.ts` deleted — `QueryClientProvider` (already in `main.tsx`) is the only provider needed
- `SessionSync` component needs a mount point in the app shell (alongside `SyncEngine`); also calls `clearLocalEncryptionUnlockMaterial` when the signed-in user changes across tabs
- All 9 `useAuth()` consumers unchanged — hook API stays identical
- `disableCookieCache: true` removed from `export.ts`; `fetchAccountProfile` eliminated entirely — settings page uses `auth.user` from the session query
- `AccountSession.isCurrent` field removed — no longer computed (required a parallel `getSession` call)

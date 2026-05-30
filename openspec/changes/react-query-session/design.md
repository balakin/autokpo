## Context

React Query (`@tanstack/react-query`) is already in the app with a `QueryClient` configured in `main.tsx`. Several parts of the app independently call `authClient.getSession()` — `AuthProvider` on mount, `fetchAccountProfile`, `fetchAccountSessions`, and `export.ts` — with no shared cache. This produces redundant network requests and two separate state systems (React context + React Query) that both track session data.

`AuthProvider` currently reads from `localStorage` synchronously for instant startup (offline-first), then validates against the server in a `useEffect`. This offline-first startup must be preserved.

## Goals / Non-Goals

**Goals:**

- Single network request for session data across all consumers
- Preserve offline-first startup: app is usable before any network response
- `useAuth()` public API unchanged — zero changes to the 9 consumer files
- `SessionSync` component follows the existing `SyncEngine` pattern for side-effect-only components

**Non-Goals:**

- Changing authentication behavior or user-facing flows
- Migrating other data fetching to React Query (separate concern)
- Removing `authClient` usage beyond `getSession` calls

## Decisions

### 1. Session state via React Query cache, not React Context

The `QueryClient` cache is already shared across the tree. A `['session']` query key serves the same shared-state role as `AuthContext` without an additional provider layer. `useAuth()` becomes a pure hook that reads from the cache.

**Alternative considered**: Keep `AuthProvider` and `AuthContext`, only add a `useQuery` call inside it. Rejected: two state systems still exist, deduplication only works within React Query consumers — `AuthProvider`'s own fetch stays separate.

### 2. `initialData` from `readStoredSession()` + `networkMode: 'offlineFirst'`

`initialData: () => readStoredSession()` populates the cache synchronously on first access — no loading flash, app opens instantly from localStorage regardless of network state.

`networkMode: 'offlineFirst'` ensures the background validation fetch is attempted even when `navigator.onLine` is false. If offline, the fetch fails but the cached `data` (last known session) remains accessible — same behavior as today.

`staleTime: 5 * 60 * 1000` (5 min): after the initial background refetch resolves, subsequent mounts within the stale window skip the network. The `initialData` has no `initialDataUpdatedAt` set, so it is always treated as stale and triggers the startup validation fetch once.

**Alternative considered**: `placeholderData` instead of `initialData`. Rejected: `placeholderData` is not persisted to the cache, so the first subscriber in a new render tree would see a loading state.

### 3. Delete `AuthProvider` and `AuthContext`

With React Query as the session source of truth, the provider only provided two things: shared state (now the RQ cache) and a logout/refresh API (now a hook). Removing it reduces the provider chain and eliminates a parallel state system.

`useAuth()` is rewritten as a pure hook — same public shape, no context dependency.

### 4. `SessionSync` component for cross-tab sync

The `window.storage` event listener that syncs session changes across tabs needs a stable mount point. A `SessionSync` component (returns `null`, mounts one `useEffect`) matches the existing `SyncEngine` pattern in `crdt-provider.tsx`. It mounts once in the app shell.

### 5. `auth.refresh()` uses `queryClient.fetchQuery`

`email-auth-page.tsx` calls `auth.refresh()` and reads the returned `userId`. `queryClient.invalidateQueries` only schedules a refetch and does not return data. `queryClient.fetchQuery({ queryKey: ['session'], staleTime: 0 })` forces a fresh fetch and returns the result synchronously — the userId can then be extracted and returned, preserving the existing `refresh()` contract.

### 6. `fetchAccountProfile` reads from cache; no `disableCookieCache`

`fetchAccountProfile` called `authClient.getSession({ disableCookieCache: true })` to bypass the server-side cookie cache for a guaranteed-fresh DB read. For displaying name/email on the settings page, stale-while-revalidate is acceptable. `fetchAccountProfile` will read `queryClient.getQueryData(['session'])` instead — no extra network call, and the account settings query's `staleTime: 5 * 60 * 1000` ensures background revalidation.

`fetchAccountSessions` still calls `authClient.listSessions()` for the sessions list, but drops its `getSession` call — the current session token for the "is current" check comes from the `['session']` cache.

## Risks / Trade-offs

- **`initialData` always stale** → always triggers one background fetch on startup. This is intentional (session validation), but means one network call always happens. Acceptable — same as today's `useEffect` in `AuthProvider`.
- **`fetchAccountProfile` shows data as fresh as the session cache** → if a user changes their name in another browser and opens settings within the 5-min stale window, they'll see the old name. Low impact — the session query background-refetches on mount anyway.
- **`SessionSync` mount point** → must be placed in a component that is always mounted while the user is in the app. Needs confirmation of the right shell component during implementation.

## Migration Plan

1. Add `use-session-query.ts` and `SessionSync` — no existing code touched
2. Rewrite `use-auth.ts` to consume the new hook
3. Remove `AuthProvider` from `main.tsx`, add `SessionSync` to shell
4. Delete `auth-provider.tsx`, `auth-context.ts`
5. Simplify `account-settings-api.ts` and `export.ts`
6. Delete `refreshSession()` from `auth-session.ts`, update `oauth-callback.tsx`

Each step is independently deployable. No data migrations required.

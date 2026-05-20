## Why

The app currently boots a global Yjs document and sync runtime before any identity boundary exists, which makes auth, logout, bundle splitting, and cross-tab session control awkward. We need an auth-first runtime model so signed-out tabs stay lightweight, signed-in tabs own user-scoped local state, and one leader tab coordinates shared side effects.

## What Changes

- Add an auth-gated application shell with `loading`, `signed_out`, and `signed_in` states, plus mock sign-in/logout flows backed by a delayed local session check.
- Add an app-level leader capability that is independent from CRDT and can coordinate auth/session fetches, logout orchestration, sync authority, and signed-out cleanup.
- Move CRDT runtime ownership from module-global singletons to the signed-in React subtree so `Y.Doc`, IndexedDB persistence, and sync side effects are created only for authenticated users and are torn down on sign-out.
- Scope Yjs IndexedDB and sync-state storage to the current user and add a leader-only signed-out cleaner that deletes all app-owned user data while preserving device-scoped preferences like theme.
- Prepare the client architecture for a later switch from mock auth to backend session endpoints with `HttpOnly` cookies, without changing the signed-in/signed-out runtime boundaries.

## Capabilities

### New Capabilities

- `user-auth`: Auth-first application flow with a signed-out entry screen, session loading gate, mock sign-in/logout actions, and leader-coordinated origin-wide logout behavior.
- `leader-coordination`: App-level leader election and state exposure for leader-owned side effects such as auth/session requests, sync authority, and signed-out cleanup.

### Modified Capabilities

- `crdt-store`: Change Yjs runtime ownership from a global boot-time singleton to a user-scoped, signed-in lifecycle resource with user-scoped persistence keys and signed-out cleanup expectations.

## Impact

- Affected app bootstrap and provider tree in `apps/app/src/main.tsx` and `apps/app/src/crdt/`.
- New auth and leader modules in the client runtime, plus signed-out cleaner behavior.
- Sync engine and related cross-tab utilities must stop depending on a CRDT-owned leader singleton.
- Yjs IndexedDB naming and `localStorage` sync/auth key strategy will change to user-scoped prefixes while preserving theme as a device preference.

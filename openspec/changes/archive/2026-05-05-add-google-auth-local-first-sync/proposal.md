## Why

The app still uses a demo local-only auth state while the worker sync backend is effectively single-user, which blocks real account-backed backup and account isolation. We need production-grade authentication now so local-first data can reopen quickly on device boot while sync, exchange-rate access, and cloud backup are bound to a real Google account and server session.

## What Changes

- Add real Google sign-in and sign-out using `better-auth`, backed by HttpOnly cookie sessions on the shared frontend/backend domain.
- Introduce a remembered local user id in `localStorage` so the app can reopen local IndexedDB/Yjs state immediately on startup without waiting for a session fetch.
- Require authenticated sessions for worker routes that should only be available to signed-in users, including exchange-rate endpoints.
- Change sync endpoints from the prototype single-user model to authenticated per-user behavior derived from the server session.
- Require every `/api/sync*` request to include a mandatory local-user assertion header so the worker can reject account/cache mismatches.
- Add structured sync error responses that distinguish unauthorized sessions, local-user mismatches, and existing idempotency conflicts.
- Keep the current leader-tab local-first sync architecture, but make logout and auth rejection wipe local auth/sync/Yjs state.
- **BREAKING** Remove the prototype hard-coded sync identity (`user_id = '0'`) and allow prototype data/model details to change as needed for real auth-backed sync.

## Capabilities

### New Capabilities

- `user-auth`: Sign in with Google, maintain HttpOnly cookie sessions, remember the last local user for optimistic boot, and perform logout/wipe flows when auth becomes invalid.

### Modified Capabilities

- `cloudflare-worker`: Worker routes become session-gated where required, sync derives identity from the authenticated session, and sync error contracts gain structured auth/mismatch conflict responses.
- `crdt-store`: Sync requests include the local-user assertion header and local-first boot/logout rules are updated around auth-backed user identity.
- `settings`: The Data section's sign-out behavior becomes a real account logout that clears local state instead of the current demo session toggle.

## Impact

- Affected frontend areas: `src/auth/*`, `src/session-gate.tsx`, `src/signed-in-app.tsx`, `src/settings/*`, and sync client/runtime code under `src/crdt/`.
- Affected worker areas: `worker/main.ts`, `worker/routes/sync.ts`, `worker/routes/exchange-rates.ts`, database/session wiring, and worker auth middleware.
- New dependency/system impact: `better-auth`, Google OAuth app configuration for local and deployed environments, auth tables in D1/Drizzle, and test/session helpers for authenticated worker and app tests.

## 1. Auth foundation

- [x] 1.1 Add `better-auth` dependencies and configure worker-side auth with D1-backed storage, Google provider settings, and shared-domain HttpOnly cookie sessions.
- [x] 1.2 Add a checked-in `.dev.vars.example` documenting the local worker auth variables needed for Google OAuth and `better-auth` local development.
- [x] 1.3 Add the required auth schema/migrations and regenerate any worker/database types affected by the new auth tables or bindings.
- [x] 1.4 Mount `better-auth` routes in the worker and add a reusable session-resolution helper for protected routes.

## 2. Worker route protection and sync identity

- [x] 2.1 Protect exchange-rate endpoints with authenticated-session checks while keeping their existing response behavior unchanged.
- [x] 2.2 Update `GET /api/sync` to derive `user_id` from the authenticated session, require `X-Local-User-Id`, and return structured `400`/`401`/`409` errors where appropriate.
- [x] 2.3 Update `POST /api/sync` and `POST /api/sync/compact` to derive `user_id` from the authenticated session, require `X-Local-User-Id`, and emit structured conflict codes for both local-user mismatch and idempotency conflicts.

## 3. Frontend auth flow

- [x] 3.1 Replace the demo auth provider with a real Google sign-in/sign-out flow using the vanilla `better-auth` client.
- [x] 3.2 Store only the remembered local user id in `localStorage` and update startup gating so the app reopens local state immediately when that remembered user exists.
- [x] 3.3 Update signed-out and settings UI flows so logout is a real account logout that clears remembered local state and returns to the signed-out screen.

## 4. Sync runtime integration

- [x] 4.1 Update sync client requests to send `X-Local-User-Id` on every `/api/sync*` request.
- [x] 4.2 Update sync/runtime error handling so `401 unauthorized` and `409 local_user_mismatch` trigger the shared logout-and-wipe flow, while `409 idempotency_conflict` remains a sync protocol error.
- [x] 4.3 Ensure per-user sync metadata and Yjs local state cleanup still preserve the leader-tab architecture and follower/leader coordination model.

## 5. Validation and regression coverage

- [x] 5.1 Add worker tests for authenticated exchange-rate access, authenticated sync access, missing `X-Local-User-Id`, local-user mismatch, and typed idempotency conflicts.
- [x] 5.2 Add app/runtime tests for remembered-user startup, logout cleanup, auth-rejection cleanup, and settings logout behavior.
- [x] 5.3 Run the relevant app and worker test suites and fix any regressions needed to make the change implementation-ready.

## Context

The current app uses a demo auth provider that stores a local `userId` in `localStorage`, while the sync worker still hard-codes all requests to `user_id = '0'`. That leaves the product without real account ownership, without a server-backed session gate, and without a safe way to distinguish “open local cache for account A” from “current browser session belongs to account B”.

This change introduces real account identity while preserving the local-first behavior that already makes the app feel fast: a device should reopen its local Yjs/IndexedDB state immediately from a remembered user id, then let authenticated worker requests confirm or invalidate that optimistic boot.

Constraints:

- Frontend and worker share the same domain, so HttpOnly cookie sessions are viable and preferred.
- The app must remain local-first and keep the single-leader-tab network architecture.
- Sync is more sensitive than shared endpoints such as exchange rates because it binds local cache identity to remote backup state.
- Prototype sync/account data can be replaced rather than migrated forward compatibly.

## Goals / Non-Goals

**Goals:**

- Add production-grade Google sign-in backed by `better-auth` and HttpOnly cookies.
- Preserve optimistic local boot by remembering only the last local user id on device startup.
- Make the worker session the sole authority for authenticated identity.
- Require `/api/sync*` requests to prove both a valid session and a matching local cache identity.
- Keep exchange-rate endpoints protected by session auth without coupling them to a user-specific local cache id.
- Standardize sync error bodies so clients can distinguish auth rejection, local-user mismatch, and idempotency conflicts.

**Non-Goals:**

- Email OTP, non-Google social providers, or account-management UI beyond the sign-in/sign-out flow.
- End-to-end encryption or other data-privacy features beyond authenticated account ownership.
- Preserving the prototype single-user server dataset or the old fake auth contract.

## Decisions

### Use `better-auth` with HttpOnly cookie sessions

The worker will mount `better-auth` endpoints and derive session identity from the request cookie. The frontend will use the vanilla `better-auth` client for sign-in/sign-out actions rather than a React `useSession()`-driven startup gate.

Rationale:

- HttpOnly cookies keep the auth secret out of `localStorage` and app JS.
- Same-domain frontend/worker deployment avoids cross-origin token complexity.
- The app does not want session hooks to block local-first startup.

Alternatives considered:

- Bearer tokens in browser storage: rejected because they weaken the security boundary and blur the distinction between “remembered local user” and “real session”.
- `better-auth/react` as the main auth state source: rejected because it would encourage session-first startup instead of optimistic local boot.

### Separate remembered local identity from authenticated session authority

The app will store only the last local user id in `localStorage`. On startup, that value determines whether local state is reopened immediately. The cookie-backed session remains authoritative and is validated later by protected worker requests.

Rationale:

- This preserves offline reloads and fast startup.
- It keeps the product model clear: local storage is a boot hint, not proof of authorization.

Alternatives considered:

- Block startup until session fetch succeeds: rejected because it makes the app server-first and degrades offline/local-first behavior.

### Require `X-Local-User-Id` on every sync request

Every `/api/sync`, `/api/sync/compact`, and any future sync-related endpoint will require a mandatory `X-Local-User-Id` header. The worker will compare it to `session.user.id`.

Resulting contract:

- No valid session -> `401 unauthorized`
- Missing required header -> `400 missing_local_user_id`
- Header present but mismatched to session user -> `409 local_user_mismatch`
- Matching header and session -> proceed with sync

Rationale:

- Sync must protect against the case where local cache belongs to user A while the browser session belongs to user B.
- The header is an assertion about the opened cache, not an authentication credential.

Alternatives considered:

- Use cookie session alone for sync: rejected because the worker cannot detect that the app booted local cache for a different account.
- Send `X-User-Id` as the effective authenticated user: rejected because the server must never trust a client header as identity authority.

### Keep exchange-rate endpoints session-gated only

Exchange-rate routes will require an authenticated session but will not require `X-Local-User-Id` because they are not partitioned by account data.

Rationale:

- The endpoint is protected for abuse/access control, not for per-user data isolation.
- It keeps the stricter local-user assertion limited to identity-bound APIs.

### Treat `401` and `409 local_user_mismatch` as logout-and-wipe events

When the sync client receives either response, it will execute the logout flow, clear the remembered local user id, clear per-user sync metadata, and delete per-user Yjs IndexedDB state. Generic network failures and server `5xx` errors will not trigger destructive cleanup.

Rationale:

- Both outcomes mean the currently opened local cache is no longer valid for continued authenticated use.
- The product model explicitly accepts brief local visibility before online validation fails.

Alternatives considered:

- Treat session expiry as non-destructive indefinitely: rejected because the chosen product direction treats auth as the recovery/backup anchor and wants logout-like cleanup on rejection.

### Keep the single-leader-tab sync architecture

The leader tab remains the only tab that talks to `/api/sync*`. Followers continue to use BroadcastChannel-based coordination for sync messages. Auth state itself is not coordinated through the sync leader/follower bus — instead, the auth provider listens to `window` `storage` events on the `autokpo:remembered-local-user` key so sign-in and sign-out in any tab are reflected immediately without requiring a separate auth BroadcastChannel.

Rationale:

- The current sync architecture is a core local-first invariant and already aligns well with per-user sync requests.
- Using `storage` events for auth state removes the need for a dedicated auth bus while still propagating auth changes across tabs reliably.

## Risks / Trade-offs

- [Optimistic local boot can briefly show stale account data] -> Accept the brief window, then enforce logout/wipe on authoritative `401` or `409` sync responses.
- [Cookie/session and local cache can drift apart on shared browsers] -> Require `X-Local-User-Id` on every sync request and reject mismatches immediately.
- [New auth dependency adds worker/database complexity] -> Keep v1 scope narrow: Google only, cookie sessions, vanilla client usage, no email OTP.
- [Prototype data/model breakage during migration] -> Treat the old single-user data model as disposable and make the change explicitly breaking.

## Migration Plan

1. Add `better-auth` server wiring, D1-backed auth tables, Google provider configuration, and authenticated worker session helpers.
2. Replace the demo auth provider with a real sign-in/sign-out flow that stores only the remembered local user id.
3. Update sync routes to derive `user_id` from the authenticated session and to validate `X-Local-User-Id`.
4. Update the sync client/runtime to send the local-user header, handle structured `401`/`409`/idempotency conflict errors, and trigger logout/wipe when required.
5. Protect exchange-rate routes with session auth.
6. Validate local startup, offline reopen, account mismatch, sign-out cleanup, and leader-tab behavior with worker/app tests.

Rollback strategy:

- Before rollout, rollback is straightforward because the change remains in development.
- After rollout, revert to the previous worker/app code only if the new auth tables and Google configuration are also disabled; prototype user data is not preserved as a rollback requirement.

## Open Questions

- What exact user-facing copy should be shown for the `409 local_user_mismatch` case?
- Should explicit logout and server-side session expiry remain distinct product behaviors in later iterations, even though both trigger the same cleanup flow in v1?

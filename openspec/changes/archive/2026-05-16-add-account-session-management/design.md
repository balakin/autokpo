## Context

Account settings currently live at `/settings/account` and are online-only. The page loads the current profile through React Query and Better Auth, then renders an account identity card plus the existing delete-account flow.

Better Auth already exposes client APIs for session management in the installed auth stack: listing sessions, revoking one session by token, and revoking all sessions except the current one.

## Goals / Non-Goals

**Goals:**

- Add an Account settings Sessions card for signed-in, online users.
- Display active sessions using safe metadata: IP address, user agent, creation time, and expiration time when available.
- Identify and protect the current session from per-session revocation.
- Support revoking one non-current session and revoking all non-current sessions.
- Use existing Better Auth client APIs and existing React Query patterns.

**Non-Goals:**

- Do not add new worker auth/session endpoints.
- Do not expose raw session tokens in the UI.
- Do not provide live cross-tab/device push notifications when a session is revoked.
- Do not change signed-out cleanup behavior.

## Decisions

### Use Better Auth client APIs directly

The Sessions card should call Better Auth through a small account-settings API wrapper rather than introducing a new app-specific worker route.

- `authClient.listSessions()` loads sessions for the current user.
- `authClient.revokeSession({ token })` revokes one non-current session.
- `authClient.revokeOtherSessions()` revokes all non-current sessions.

Alternative considered: add custom worker endpoints. This would duplicate Better Auth behavior without adding value for the current requirements.

### Use React Query for list and mutations

Session listing should be a React Query query enabled only when the account page is online and the user is signed in. Revocation operations should be React Query mutations that invalidate/refetch the sessions query on success.

Alternative considered: use Better Auth's reactive current-session hook only. That does not cover listing and revoking other sessions.

### Compare against the current session before rendering actions

The implementation should load or derive the current session and compare listed sessions by stable session identity, preferring session ID when available and falling back to token comparison if needed. The current session row should be marked and should not show an individual revoke action.

Alternative considered: assume the first listed session is current. This is fragile because ordering is not part of the UI contract.

### Treat session metadata as optional display data

The UI should render IP address, user agent, creation time, and expiration time when available, with clear fallbacks when Better Auth omits a field. Better Auth does not provide a documented real last-activity field for listed sessions, and `updatedAt` is tied to session refresh/write behavior rather than every request. The UI should therefore avoid activity/last-used labels and show `createdAt` and `expiresAt` instead.

Alternative considered: require all metadata fields. This would make the UI brittle across Better Auth versions and environments where IP/user-agent capture is unavailable.

## Risks / Trade-offs

- Better Auth session return fields may vary by version or environment → Keep display fields optional and typed defensively.
- User-agent strings can be long or technical → Display a lightweight friendly browser/OS label for common user agents and fall back to the raw string when parsing is unavailable.
- Other tabs on the same device may share the current cookie session → Frame actions around sessions/devices without promising per-tab control.
- Mutation succeeds but refetch temporarily fails → Show mutation feedback and leave the next query/error state to the existing account online/error pattern.

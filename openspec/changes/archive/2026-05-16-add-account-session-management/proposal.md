## Why

Users can sign in on multiple devices, but Account settings currently do not show where the account is active or provide a way to revoke sessions. Adding session management gives users direct control over other device access.

## What Changes

- Add a Sessions card to the Account settings tab while online account settings are available.
- Show active Better Auth sessions with IP address, user agent, creation time, and expiration time when available.
- Mark the current session and prevent revoking it from the sessions list.
- Allow revoking one non-current session.
- Allow revoking all non-current sessions except the current session.

## Capabilities

### New Capabilities

- `account-session-management`: Active session visibility and revocation behavior within Account settings.

### Modified Capabilities

- `account-settings`: Account settings gains an online-only Sessions card alongside existing account identity and delete-account controls.

## Impact

- Affected UI: `apps/app/src/settings/account-settings-page.tsx`
- Affected client API wrapper area: `apps/app/src/settings/account-settings-api.ts`
- Uses existing Better Auth client session APIs: `listSessions`, `revokeSession`, and `revokeOtherSessions`
- Uses existing React Query patterns for online-only account data loading and mutations
- No new worker endpoint or database migration is expected
- Tests should cover session display, current-session protection, individual revocation, revoke-all-other behavior, loading/error states, and offline account settings behavior

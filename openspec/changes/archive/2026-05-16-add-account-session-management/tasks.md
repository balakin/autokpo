## 1. Session API Layer

- [x] 1.1 Add account session types and wrappers in the account settings API module for listing sessions, revoking one session by token, and revoking all other sessions.
- [x] 1.2 Normalize optional Better Auth session metadata into UI-safe fields, including current-session identity, IP address fallback, user-agent fallback, creation timestamp fallback, and expiration timestamp fallback.

## 2. Account Settings UI

- [x] 2.1 Update Account settings layout to render the existing account card and a separate Sessions card when online account settings are loaded.
- [x] 2.2 Add a sessions React Query query enabled only for signed-in online Account settings.
- [x] 2.3 Render session rows with current-session marking, IP address, user agent, creation time, and expiration time without exposing raw tokens.
- [x] 2.4 Place the revoke-all-other-sessions action at the left edge of the Sessions card action area.
- [x] 2.5 Add mutation for revoking one non-current session, with pending/error feedback and sessions query refresh on success.
- [x] 2.6 Add mutation for revoking all non-current sessions, hidden when no other sessions exist, with sessions query refresh on success.
- [x] 2.7 Keep account identity/delete controls available when the sessions query fails and show an inline Sessions card error state.

## 3. Internationalization

- [x] 3.1 Wrap all new UI strings in Lingui translation macros following existing TSX conventions.
- [x] 3.2 Run message extraction and fill translations for supported locales.

## 4. Tests and Validation

- [x] 4.1 Add tests for active session rendering, metadata fallbacks, and token non-disclosure.
- [x] 4.2 Add tests that the current session is marked and cannot be individually revoked.
- [x] 4.3 Add tests for individual non-current session revocation success and failure states.
- [x] 4.4 Add tests for revoking all non-current sessions, including hiding the action in the no-other-sessions state.
- [x] 4.5 Add tests that offline Account settings does not issue a sessions query and that sessions query failure is contained to the Sessions card.
- [x] 4.6 Run the relevant Vitest, i18n extraction, and build/typecheck checks for the app package.

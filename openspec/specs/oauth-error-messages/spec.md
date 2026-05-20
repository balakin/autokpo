### Requirement: `access_denied` OAuth error shows a user-cancelled message with no error code

When `OAuthCallback` receives `?error=access_denied`, the component SHALL display a localized friendly message indicating the user cancelled the sign-in. The raw error code SHALL NOT be shown — the user initiated the cancellation and there is nothing to debug.

#### Scenario: access_denied shows cancel message and no error code element

- **WHEN** `OAuthCallback` receives `?error=access_denied`
- **THEN** the component displays a localized message indicating the user cancelled sign-in
- **AND** no error code element is rendered

### Requirement: Known actionable OAuth error codes show specific localized messages with no error code

When `OAuthCallback` receives `?error=<code>` for any of the recognized actionable codes (`email_not_found`, `state_mismatch`, `please_restart_the_process`, `missing_session`), the component SHALL display a specific localized message relevant to that error. The raw error code SHALL NOT be shown alongside these messages. This tier is distinct from the `account_not_linked` handling (which is already covered by the social-auth-collision spec) but follows the same no-raw-code rule.

#### Scenario: email_not_found shows provider email guidance and no raw code

- **WHEN** `OAuthCallback` receives `?error=email_not_found`
- **THEN** the component displays a localized message guiding the user to sign in via email OTP
- **AND** no raw error code element is rendered

#### Scenario: state_mismatch shows session-expired message and no raw code

- **WHEN** `OAuthCallback` receives `?error=state_mismatch`
- **THEN** the component displays a localized message indicating the session may have expired and asking the user to try again
- **AND** no raw error code element is rendered

#### Scenario: please_restart_the_process shows session-expired message and no raw code

- **WHEN** `OAuthCallback` receives `?error=please_restart_the_process`
- **THEN** the component displays the same session-expired localized message as `state_mismatch`
- **AND** no raw error code element is rendered

#### Scenario: missing_session shows retry message and no raw code

- **WHEN** `OAuthCallback` receives `?error=missing_session`
- **THEN** the component displays a localized message asking the user to try signing in again
- **AND** no raw error code element is rendered

### Requirement: Unrecognized OAuth error codes show a generic translated message with the code in small muted text

When `OAuthCallback` receives `?error=<code>` for any error code not matched by a more specific tier, the component SHALL display a generic translated failure message. The error code SHALL be rendered below the message in small muted text (e.g. `text-xs text-foreground-400`) so users can copy it for support without it dominating the error card. The back-to-sign-in action SHALL be shown.

#### Scenario: Unrecognized code shows generic message and small muted code element

- **WHEN** `OAuthCallback` receives an `error` query param with any unrecognized code
- **THEN** the component displays a generic translated failure message
- **AND** the error code is rendered in a small muted element below the message
- **AND** the component shows the back-to-sign-in action

## ADDED Requirements

### Requirement: OAuthCallback displays a localized message for user-cancelled sign-in

When the OAuth callback receives `error=access_denied`, the `OAuthCallback` component SHALL display a localized message indicating the user cancelled the sign-in. No raw error code SHALL be displayed.

#### Scenario: access_denied shows cancel message without error code

- **WHEN** `OAuthCallback` receives `?error=access_denied`
- **THEN** the component displays a localized message indicating the sign-in was cancelled
- **AND** the raw code `access_denied` is NOT displayed anywhere on the page

### Requirement: OAuthCallback displays actionable messages for known transient or provider errors

For the error codes `email_not_found`, `state_mismatch`, `please_restart_the_process`, and `missing_session`, the `OAuthCallback` component SHALL display a specific localized message appropriate to that error. No raw error code SHALL be displayed for these codes.

#### Scenario: email_not_found shows provider email guidance

- **WHEN** `OAuthCallback` receives `?error=email_not_found`
- **THEN** the component displays a localized message explaining the provider did not supply an email address and directing the user to sign in via email OTP
- **AND** the raw code `email_not_found` is NOT displayed

#### Scenario: state_mismatch shows session-expired guidance

- **WHEN** `OAuthCallback` receives `?error=state_mismatch`
- **THEN** the component displays a localized message indicating the session expired and directing the user to try again
- **AND** the raw code `state_mismatch` is NOT displayed

#### Scenario: please_restart_the_process shows session-expired guidance

- **WHEN** `OAuthCallback` receives `?error=please_restart_the_process`
- **THEN** the component displays the same localized session-expired message as `state_mismatch`
- **AND** the raw code `please_restart_the_process` is NOT displayed

#### Scenario: missing_session shows retry guidance

- **WHEN** `OAuthCallback` receives `?error=missing_session`
- **AND** the session refresh returns no session
- **THEN** the component displays a localized message indicating sign-in did not complete and directing the user to try again
- **AND** the raw code `missing_session` is NOT displayed

### Requirement: OAuthCallback displays a generic message with a small muted error code for unrecognized errors

For any error code not in Tier 1 or Tier 2, the `OAuthCallback` component SHALL display a generic localized failure message and render the raw error code in small, muted text below the message.

#### Scenario: Unrecognized error code shows generic message and small muted code

- **WHEN** `OAuthCallback` receives an `error` query param with a code not in the known set
- **THEN** the component displays a generic localized failure message
- **AND** the raw error code is rendered in small, muted text (not prominently)
- **AND** the back-to-sign-in action is shown

## ADDED Requirements

### Requirement: Social sign-in collision with existing email account is blocked with a clear error

When a user attempts to sign in with a social provider (Google or GitHub) and an account already exists for the same email address (created via email OTP), the system SHALL block the sign-in and redirect to the OAuth callback error page with the code `account_not_linked`. No new account SHALL be created and no accounts SHALL be merged.

The `OAuthCallback` component SHALL recognize the `account_not_linked` error code and display a localized message explaining that an account with that email already exists and directing the user to sign in via email OTP instead.

#### Scenario: Social sign-in with existing email account shows collision error

- **WHEN** a user completes an OAuth flow with a social provider
- **AND** an account with the same email already exists (created via email OTP)
- **THEN** better-auth redirects to the OAuth callback route with `?error=account_not_linked`
- **AND** no new account is created
- **AND** no accounts are merged

#### Scenario: OAuthCallback renders a specific message for account_not_linked

- **WHEN** `OAuthCallback` receives `?error=account_not_linked`
- **THEN** the component displays a localized message explaining that an account with that email already exists
- **AND** the component directs the user to sign in via email code instead
- **AND** the component shows a back-to-sign-in action pointing to `/sign-in`

#### Scenario: Unknown error codes still render the generic error fallback

- **WHEN** `OAuthCallback` receives an `error` query param with any unrecognized code
- **THEN** the component displays the generic failure heading and the raw error code
- **AND** the component shows the back-to-sign-in action

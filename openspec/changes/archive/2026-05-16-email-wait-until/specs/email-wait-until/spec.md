## ADDED Requirements

### Requirement: Auth email sends are non-blocking

The system SHALL dispatch auth-triggered emails (OTP, account deletion) via `ExecutionContext.waitUntil` so that the HTTP response is returned before the email send begins.

#### Scenario: OTP email does not block auth response

- **WHEN** a sign-in OTP is requested
- **THEN** the auth endpoint returns a response without waiting for the email send to complete

#### Scenario: Account deleted email does not block auth response

- **WHEN** a user account is deleted
- **THEN** the auth endpoint returns a response without waiting for the confirmation email to complete

#### Scenario: Email send failure does not affect auth response

- **WHEN** the email provider returns an error during a waitUntil-dispatched send
- **THEN** the auth response is unaffected and no error is surfaced to the client

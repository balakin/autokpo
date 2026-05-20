## MODIFIED Requirements

### Requirement: Email OTP request sends a sign-in code without creating a session

The system SHALL support requesting a sign-in one-time password for an email address through Better Auth's email OTP flow. Requesting a code SHALL trigger worker-side email delivery and SHALL NOT by itself authenticate the browser session. The worker SHALL only send OTP emails for requests with `type: sign-in`; other OTP types SHALL be silently ignored.

The worker SHALL send the OTP email via the Resend REST API using a pre-registered saved template referenced by alias. The request body SHALL use `template: { id, variables }` rather than inline `text` or `html` content. The template alias SHALL be supplied through a `RESEND_OTP_TEMPLATE_ID` environment binding. The OTP value SHALL be passed as `{ OTP: otp }` in the `variables` map.

#### Scenario: Requesting a code sends OTP email via Resend saved template

- **WHEN** a signed-out user submits an email address to request a sign-in code
- **THEN** the system SHALL invoke the Better Auth email OTP send flow for `type: sign-in`
- **AND** the worker SHALL POST to `https://api.resend.com/emails` with `template: { id: <RESEND_OTP_TEMPLATE_ID>, variables: { OTP: <generated-code> } }`
- **AND** the recipient SHALL receive a branded HTML email with the sign-in code substituted in place of the `{{{OTP}}}` placeholder

#### Scenario: Requesting a code does not sign the user in

- **WHEN** a signed-out user successfully requests a one-time code
- **THEN** the browser SHALL remain signed out until the code is later verified successfully

#### Scenario: Email send failure surfaces as an error

- **WHEN** the Resend API call fails (non-2xx response)
- **THEN** the worker SHALL throw an error, causing the Better Auth request to fail
- **AND** the client SHALL surface the failure as a toast notification on the email form

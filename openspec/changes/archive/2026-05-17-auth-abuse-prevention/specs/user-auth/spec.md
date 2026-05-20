## MODIFIED Requirements

### Requirement: Email OTP request sends a sign-in code without creating a session

The system SHALL support requesting a sign-in one-time password for an email address through Better Auth's email OTP flow. Requesting a code SHALL trigger worker-side email delivery and SHALL NOT by itself authenticate the browser session. The worker SHALL only send OTP emails for requests with `type: sign-in`; other OTP types SHALL be silently ignored.

Before sending an OTP, the worker SHALL enforce three protective checks in this order:

1. **Captcha validation**: the request SHALL include a valid Cloudflare Turnstile token in the `x-captcha-response` header (when `TURNSTILE_SECRET_KEY` is configured in the environment)
2. **Rate limit**: the request SHALL not exceed the per-IP rate limit on the OTP send endpoint
3. **Blocklist check**: the target email domain SHALL not appear in the disposable email blocklist

If any check fails, the OTP SHALL NOT be sent.

The client SHALL obtain a Turnstile token from the Turnstile widget rendered on the sign-in form and attach it to the OTP send request via the `x-captcha-response` header. The widget SHALL only be rendered when `VITE_TURNSTILE_SITE_KEY` is set in the client environment.

#### Scenario: Requesting a code sends OTP email

- **WHEN** a signed-out user submits an email address to request a sign-in code
- **AND** the Turnstile token is valid (test keys always pass in dev)
- **AND** the IP has not exceeded the rate limit
- **AND** the email domain is not in the disposable email blocklist
- **THEN** the system SHALL invoke the Better Auth email OTP send flow for `type: sign-in`
- **AND** the worker SHALL send the generated code to that email address via Resend

#### Scenario: Requesting a code does not sign the user in

- **WHEN** a signed-out user successfully requests a one-time code
- **THEN** the browser SHALL remain signed out until the code is later verified successfully

#### Scenario: Email send failure surfaces as an error

- **WHEN** the Resend API call fails (non-2xx response)
- **THEN** the worker SHALL throw an error, causing the Better Auth request to fail
- **AND** the client SHALL surface the failure as a toast notification on the email form

#### Scenario: OTP request with invalid Turnstile token is rejected

- **WHEN** a signed-out user submits an OTP request without a valid `x-captcha-response` token
- **THEN** the worker SHALL reject the request before sending any email

#### Scenario: OTP request to disposable email domain is rejected

- **WHEN** a signed-out user submits an email address whose domain is in the disposable email blocklist
- **THEN** the worker SHALL reject the request before sending any email

#### Scenario: OTP request exceeding rate limit is rejected

- **WHEN** an IP address has exceeded the configured OTP send rate limit
- **THEN** the worker SHALL reject subsequent requests before sending any email

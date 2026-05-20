### Requirement: Disposable email domain blocklist rejects OTP sends

The worker SHALL maintain a static blocklist of known disposable/temporary email domains. Before sending an OTP email, the worker SHALL check whether the target email's domain appears in the blocklist. If the domain is blocked, the OTP SHALL NOT be sent and the request SHALL be rejected with an appropriate error.

#### Scenario: OTP request to a disposable email domain is rejected

- **WHEN** a user submits an email address whose domain is in the disposable email blocklist
- **THEN** the worker SHALL reject the OTP send request
- **AND** no email SHALL be sent via Resend
- **AND** the client SHALL receive an error response

#### Scenario: OTP request to a legitimate email domain proceeds

- **WHEN** a user submits an email address whose domain is NOT in the disposable email blocklist
- **THEN** the blocklist check SHALL pass and the OTP send flow SHALL continue normally

### Requirement: Cloudflare Turnstile captcha protects the OTP send endpoint

The worker SHALL validate a Cloudflare Turnstile token on every request to the email OTP send endpoint. The token SHALL be passed by the client in the `x-captcha-response` header. Requests with a missing or invalid token SHALL be rejected before any email is sent.

When `TURNSTILE_SECRET_KEY` is not present in the worker environment (development), the worker SHALL fall back to Cloudflare's published test secret key, which always passes validation. The client widget SHALL similarly fall back to Cloudflare's test site key when `VITE_TURNSTILE_SITE_KEY` is not set. The full captcha code path remains active in all environments.

#### Scenario: Valid Turnstile token allows OTP send to proceed

- **WHEN** a client sends a valid Turnstile token in the `x-captcha-response` header
- **THEN** the captcha check SHALL pass and the OTP send flow SHALL continue

#### Scenario: Missing or invalid token rejects the request

- **WHEN** a client sends an OTP request without a valid `x-captcha-response` token
- **THEN** the worker SHALL reject the request
- **AND** no email SHALL be sent

#### Scenario: Captcha uses test keys in development

- **WHEN** `TURNSTILE_SECRET_KEY` is absent from the worker environment
- **THEN** the worker SHALL use Cloudflare's test secret key for validation (always passes)
- **AND** the client SHALL render the Turnstile widget using Cloudflare's test site key
- **AND** the full captcha validation code path SHALL remain active

### Requirement: IP-based rate limiting caps OTP send requests

The worker SHALL enforce a per-IP rate limit on the email OTP send endpoint using better-auth's built-in rate limiting backed by D1. Requests exceeding the limit within the configured time window SHALL be rejected.

#### Scenario: Request within rate limit is allowed

- **WHEN** an IP address sends an OTP request that does not exceed the configured limit
- **THEN** the request SHALL proceed normally

#### Scenario: Request exceeding rate limit is rejected

- **WHEN** an IP address exceeds the configured number of OTP send requests within the time window
- **THEN** the worker SHALL reject the request with a rate-limit error
- **AND** no email SHALL be sent

### Requirement: OTP resend reuses the existing code

When a user requests a resend before the current OTP has expired, the worker SHALL reuse the existing OTP rather than generating a new one. The existing OTP's expiry SHALL be extended from the moment of resend. At no point SHALL more than one valid OTP exist for a given email address.

#### Scenario: Resend returns the same OTP code

- **WHEN** a user requests a resend while a valid OTP already exists for their email
- **THEN** the same OTP code SHALL be sent (not a new one)
- **AND** the OTP's expiry SHALL be reset to the full expiry window from the time of resend

#### Scenario: Only one valid OTP exists after resend

- **WHEN** a user has received an OTP and then requests a resend
- **THEN** only one valid OTP SHALL exist for that email address
- **AND** the previously received code SHALL remain valid (it is the same code)

### Requirement: OTP verification is limited to 5 attempts

The worker SHALL track failed OTP verification attempts. After 5 consecutive failed attempts, the OTP SHALL be invalidated regardless of its remaining expiry time. The user MUST request a new OTP to continue.

#### Scenario: OTP is invalidated after 5 failed attempts

- **WHEN** a user submits an incorrect OTP 5 times for the same code
- **THEN** the OTP SHALL be invalidated
- **AND** subsequent verification attempts with any code SHALL fail until a new OTP is requested

#### Scenario: Correct OTP before attempt limit succeeds

- **WHEN** a user submits the correct OTP within the first 5 attempts
- **THEN** verification SHALL succeed normally

### Requirement: Frontend enforces a 60-second resend cooldown

The client SHALL prevent the user from requesting a resend for at least 60 seconds after the most recent OTP send. The resend action SHALL be unavailable (visually and functionally) during this cooldown period.

#### Scenario: Resend is blocked during cooldown

- **WHEN** an OTP has been sent within the last 60 seconds
- **THEN** the resend action SHALL be disabled
- **AND** the UI SHALL display the remaining cooldown time in seconds

#### Scenario: Resend becomes available after cooldown

- **WHEN** 60 seconds have elapsed since the last OTP send
- **THEN** the resend action SHALL become available to the user

### Requirement: OTP expires after 300 seconds

A sent OTP SHALL become invalid 300 seconds (5 minutes) after it was originally issued. A resend extends the expiry by 300 seconds from the time of resend.

#### Scenario: OTP rejected after expiry

- **WHEN** a user submits an OTP more than 300 seconds after it was issued (or last extended by resend)
- **THEN** verification SHALL fail with an expiry error

#### Scenario: Resend extends OTP expiry

- **WHEN** a user requests a resend of an existing OTP
- **THEN** the OTP's expiry SHALL be reset to 300 seconds from the time of resend

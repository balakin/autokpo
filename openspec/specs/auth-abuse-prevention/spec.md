## Purpose

Auth abuse prevention through disposable email blocking, captcha verification, rate limiting, OTP reuse/extensions, and cooldown enforcement.

## Requirements

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

### Requirement: Auth endpoints have an explicit database-backed global rate limit

The worker SHALL configure Better Auth rate limiting explicitly for all auth endpoints. The rate limiter SHALL be enabled in every runtime environment and SHALL use D1-backed storage. Endpoint-specific rules MAY override the global rule only to make a sensitive endpoint stricter.

#### Scenario: Auth request within the global rate limit proceeds

- **WHEN** a client sends requests to an auth endpoint without exceeding the configured global limit for its IP and path
- **THEN** Better Auth SHALL process the requests normally

#### Scenario: Auth request exceeding the global rate limit is rejected

- **WHEN** a client exceeds the configured global auth rate limit for an endpoint
- **THEN** the worker SHALL reject the request with a Better Auth rate-limit response

#### Scenario: OTP send keeps its stricter rate limit

- **WHEN** a client sends requests to `/api/auth/email-otp/send-verification-otp`
- **THEN** the worker SHALL apply the OTP-send-specific rate limit instead of relaxing to the global auth rule

### Requirement: Unused Better Auth endpoints are not reachable

The worker SHALL disable unused Better Auth password, password reset, email verification, account update, account linking, account unlinking, and unused email-OTP auxiliary endpoints using Better Auth configuration.

#### Scenario: Used auth endpoint is allowed

- **WHEN** a client requests a Better Auth endpoint required by the app, such as `GET /api/auth/get-session` or `POST /api/auth/sign-in/email-otp`
- **THEN** the worker SHALL allow the request to reach Better Auth

#### Scenario: Unused auth endpoint is hidden

- **WHEN** a client requests an unused Better Auth endpoint, such as `POST /api/auth/sign-in/email`, `POST /api/auth/update-user`, or `POST /api/auth/link-social`
- **THEN** Better Auth SHALL reject the request as not found through disabled route configuration
- **AND** the response SHALL NOT disclose an enabled auth flow for that endpoint

#### Scenario: OAuth callbacks for configured providers remain reachable

- **WHEN** Google or GitHub redirects the browser to the Better Auth callback endpoint for that provider
- **THEN** the worker SHALL allow the callback request to reach Better Auth

### Requirement: Auth input fields are bounded before persistence-sensitive processing

The worker SHALL bound small user-controlled auth inputs before they can create persistent auth records or trigger side effects. Email inputs used for email OTP side effects SHALL be trimmed and limited to 254 characters. App-specific auth headers such as `X-Preferred-Locale` SHALL be allowlisted to supported locales before use.

#### Scenario: Oversized email is rejected

- **WHEN** a client submits an auth email value longer than 254 characters after trimming
- **THEN** the worker SHALL reject the request before sending an OTP or creating auth records

#### Scenario: Unsupported preferred locale falls back safely

- **WHEN** a client sends an unsupported or oversized `X-Preferred-Locale` header on an auth request
- **THEN** the worker SHALL use the default source locale instead of the raw header value

### Requirement: Persisted auth session metadata is bounded

The worker SHALL prevent unbounded request metadata from being persisted in Better Auth session records. The persisted session `userAgent` SHALL be truncated or set to `null` when it exceeds the configured maximum. The persisted session `ipAddress` SHALL either be disabled or bounded to a small configured maximum.

#### Scenario: Oversized user agent is not stored raw

- **WHEN** a sign-in request contains a `User-Agent` header longer than the configured session user-agent maximum
- **THEN** the created session SHALL NOT store the raw oversized header value

#### Scenario: Normal user agent remains useful

- **WHEN** a sign-in request contains a normal-size `User-Agent` header
- **THEN** the created session SHALL store a bounded value that remains suitable for Account settings display

#### Scenario: IP metadata is bounded or disabled

- **WHEN** Better Auth creates or updates a session with IP metadata
- **THEN** the persisted IP metadata SHALL either be absent by policy or fit within the configured maximum length

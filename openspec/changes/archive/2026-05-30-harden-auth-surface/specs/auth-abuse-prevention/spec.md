## ADDED Requirements

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

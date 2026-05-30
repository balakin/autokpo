## ADDED Requirements

### Requirement: Authenticated application API rate limiting

The system SHALL apply rate limiting to protected non-auth application API route groups after authenticating the request and before executing route business logic.

#### Scenario: Allowed authenticated request continues

- **WHEN** an authenticated request to a protected non-auth application API route group is under the configured route-group limit
- **THEN** the request continues to the route handler

#### Scenario: Rate-limited authenticated request returns 429

- **WHEN** an authenticated request to a protected non-auth application API route group exceeds the configured route-group limit
- **THEN** the worker responds with status `429 Too Many Requests` without executing the route handler

### Requirement: User-scoped limiter identity

The system SHALL use the authenticated user's id and the route group as the primary rate-limit key for protected non-auth application APIs.

#### Scenario: Users on the same network have separate buckets

- **WHEN** two authenticated users send requests to the same protected route group from the same IP address
- **THEN** each user's requests are counted against a separate rate-limit key

#### Scenario: Route groups have separate buckets

- **WHEN** the same authenticated user sends requests to different protected route groups
- **THEN** each route group's requests are counted against a separate rate-limit key

### Requirement: Non-auth API session middleware

The system SHALL provide middleware for protected non-auth application APIs that validates the Better Auth session and makes the session available to downstream middleware and handlers.

#### Scenario: Missing session is rejected before rate-limit check

- **WHEN** a request to a protected non-auth application API has no valid session
- **THEN** the worker responds with an unauthorized response before route business logic runs

#### Scenario: Valid session is available downstream

- **WHEN** a request to a protected non-auth application API has a valid session
- **THEN** downstream rate-limit middleware and handlers can read the authenticated session from the Hono context

### Requirement: Auth endpoint limiter remains unchanged

The system SHALL keep `/api/auth/*` rate limiting owned by Better Auth and SHALL NOT replace the existing OTP email limit or Turnstile protection as part of non-auth API rate limiting.

#### Scenario: Auth request uses Better Auth limiter

- **WHEN** a request is made to `/api/auth/*`
- **THEN** the request is handled by Better Auth's existing auth endpoint protections rather than the non-auth API route-group limiter

### Requirement: Route-specific authorization remains explicit

The system SHALL preserve route-specific authorization and validation checks in the relevant route group after generic authentication and rate limiting complete.

#### Scenario: Sync local-user mismatch remains conflict

- **WHEN** an authenticated `GET /api/sync` request is under the configured rate limit but includes an `X-Local-User-Id` that does not match the session user id
- **THEN** the sync route responds with the existing local-user mismatch conflict behavior

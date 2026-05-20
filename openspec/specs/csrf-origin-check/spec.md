### Requirement: Safe methods are never blocked

The worker SHALL allow GET, HEAD, and OPTIONS requests to pass through without any origin validation, regardless of whether a Cookie header is present.

#### Scenario: GET request with cookies passes through

- **WHEN** a GET request is received with a Cookie header
- **THEN** the request is processed normally without origin validation

### Requirement: Requests without cookies are never blocked

The worker SHALL allow non-safe requests that do not carry a Cookie header to pass through without origin validation.

#### Scenario: POST without cookies passes through

- **WHEN** a POST request is received with no Cookie header
- **THEN** the request is processed normally without origin validation

### Requirement: Cookie-bearing mutations require a valid Origin

The worker SHALL reject non-safe requests that carry a Cookie header if the Origin (or Referer) header is absent, null, or does not match the configured APP_URL origin.

#### Scenario: POST with cookies and no Origin is rejected

- **WHEN** a POST request is received with a Cookie header and no Origin or Referer header
- **THEN** the worker returns 403 with `{ "code": "missing_origin" }`

#### Scenario: POST with cookies and null Origin is rejected

- **WHEN** a POST request is received with a Cookie header and `Origin: null`
- **THEN** the worker returns 403 with `{ "code": "missing_origin" }`

#### Scenario: POST with cookies and wrong Origin is rejected

- **WHEN** a POST request is received with a Cookie header and an Origin that does not match APP_URL
- **THEN** the worker returns 403 with `{ "code": "invalid_origin" }`

#### Scenario: POST with cookies and correct Origin is allowed

- **WHEN** a POST request is received with a Cookie header and an Origin matching APP_URL
- **THEN** the request proceeds to the route handler

#### Scenario: Referer is accepted as fallback when Origin is absent

- **WHEN** a POST request is received with a Cookie header, no Origin header, and a Referer header whose origin matches APP_URL
- **THEN** the request proceeds to the route handler

### Requirement: Origin check applies to all endpoints

The CSRF origin check SHALL be enforced globally across all worker endpoints, including better-auth routes, sync routes, and avatar routes.

#### Scenario: Auth endpoint mutation with wrong Origin is rejected

- **WHEN** a POST request to `/api/auth/*` is received with a Cookie header and an untrusted Origin
- **THEN** the worker returns 403 before reaching the better-auth handler

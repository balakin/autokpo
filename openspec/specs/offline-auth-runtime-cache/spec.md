# offline-auth-runtime-cache Specification

## Purpose

TBD - created by archiving change simplify-offline-session-keyring-cache. Update Purpose after archive.

## Requirements

### Requirement: Protected session and key-ring GETs use NetworkFirst runtime caches

The service worker SHALL runtime-cache only `/api/auth/get-session` and `GET /api/e2ee/key-ring` as protected API runtime caches. Each protected cache SHALL use a NetworkFirst strategy, SHALL use a stable named cache, and SHALL store only successful `200` responses.

The service worker SHALL NOT broadly runtime-cache `/api/*`, SHALL NOT runtime-cache sync endpoints, and SHALL NOT runtime-cache arbitrary auth endpoints beyond the exact session read endpoint.

#### Scenario: Online session request uses server response

- **WHEN** the browser requests `/api/auth/get-session` while the network is available
- **THEN** the service worker SHALL return the network response
- **AND** if the response status is `200`, the service worker SHALL update the named auth-session runtime cache

#### Scenario: Offline session request uses cached local identity

- **WHEN** the browser requests `/api/auth/get-session` while the network is unavailable
- **AND** a successful session response was previously cached
- **THEN** the service worker SHALL return the cached session response

#### Scenario: Online key-ring request uses server response

- **WHEN** the browser requests `GET /api/e2ee/key-ring` while the network is available
- **THEN** the service worker SHALL return the network response
- **AND** if the response status is `200`, the service worker SHALL update the named key-ring runtime cache

#### Scenario: Offline key-ring request uses cached encrypted profile

- **WHEN** the browser requests `GET /api/e2ee/key-ring` while the network is unavailable
- **AND** a successful key-ring profile response was previously cached
- **THEN** the service worker SHALL return the cached encrypted key-ring profile response

#### Scenario: Failed responses are not cached

- **WHEN** the session endpoint or `GET /api/e2ee/key-ring` returns a non-`200` response
- **THEN** the service worker SHALL NOT store that response in the protected runtime caches

### Requirement: Protected runtime caches are cleared on auth boundaries

The application SHALL clear the named auth-session and key-ring runtime caches after successful online logout. The application SHALL clear these caches by cache name via `cleanupSignedOutSession` and `clearProtectedCaches`.

#### Scenario: Successful logout clears protected runtime caches

- **WHEN** a signed-in user completes online logout successfully
- **THEN** the application SHALL delete the named auth-session runtime cache
- **AND** the application SHALL delete the named key-ring runtime cache

#### Scenario: Login or user switch updates protected caches naturally

- **WHEN** the application observes a login or a session user id change from one user to another
- **THEN** the session query SHALL be updated with the new user data
- **AND** the encryption gate SHALL re-mount with the new user id and fetch its key-ring profile through the user-scoped query
- **AND** the protected runtime caches SHALL be updated through subsequent online fetches for the new user's session and key-ring

#### Scenario: Offline logout fails without clearing caches

- **WHEN** the browser is offline
- **AND** the user attempts to log out
- **THEN** the `authClient.signOut()` fetch SHALL fail
- **AND** the application SHALL NOT complete the logout cleanup flow (cache clearing, local wrapper deletion, query cache clearing) as if the server session was cleared

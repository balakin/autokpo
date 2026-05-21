## MODIFIED Requirements

### Requirement: Avatar objects are served from R2

The system SHALL serve same-origin `/avatars/{randomUUID}` requests only to authenticated users who own the requested avatar. The worker SHALL require a valid session and SHALL verify the requested avatar path matches the session user's current `image` field before serving. Responses SHALL carry `Cache-Control: no-store` so only the service worker cache — not the browser HTTP cache — retains the image.

#### Scenario: Existing avatar is served to its owner

- **WHEN** an authenticated user requests `/avatars/{randomUUID}` and that path matches their current `image` field
- **THEN** the worker SHALL return the R2 object bytes
- **AND** the response SHALL include the object's content type
- **AND** the response SHALL set `Cache-Control: no-store`

#### Scenario: Unauthenticated request is rejected

- **WHEN** a request for `/avatars/{randomUUID}` arrives without a valid session
- **THEN** the worker SHALL return a 401 response

#### Scenario: Avatar belonging to another user returns not found

- **WHEN** an authenticated user requests `/avatars/{randomUUID}` that does not match their current `image` field
- **THEN** the worker SHALL return a 404 response

#### Scenario: Missing avatar returns not found

- **WHEN** an authenticated user requests `/avatars/{randomUUID}` for an R2 object that does not exist
- **THEN** the worker SHALL return a 404 response
- **AND** the response SHALL NOT return the SPA HTML fallback

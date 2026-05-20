## ADDED Requirements

### Requirement: Profile images are app-owned assets

The system SHALL store rendered profile images as app-owned objects and SHALL NOT render OAuth provider image URLs in the browser. Profile image object keys SHALL use extensionless random UUID paths under `avatars/`, and public image paths SHALL be exposed as `/avatars/{randomUUID}`.

#### Scenario: Rendered avatar uses app-owned URL

- **WHEN** a user has a non-null profile image
- **THEN** the image URL SHALL be a same-origin `/avatars/{randomUUID}` path
- **AND** the URL SHALL NOT contain the user's id, email address, or OAuth provider image URL

#### Scenario: Provider URL is not rendered

- **WHEN** an OAuth provider supplies a profile image URL during sign-up
- **THEN** the browser SHALL NOT render that provider URL as an image source

### Requirement: User can upload a normalized profile image

The system SHALL provide an authenticated profile image change endpoint that accepts only browser-normalized WebP avatar uploads. The browser SHALL allow JPEG, PNG, and WebP source images, crop the selected image to a square, resize it to 512×512, encode it as WebP, and submit it to the endpoint.

#### Scenario: WebP avatar upload succeeds

- **WHEN** a signed-in user uploads a valid `image/webp` avatar payload no larger than 256 KB
- **THEN** the worker SHALL store the avatar in R2 under `avatars/{randomUUID}`
- **AND** the worker SHALL update the user's `image` to `/avatars/{randomUUID}`
- **AND** the worker SHALL set the user's `imageStatus` to `ready`

#### Scenario: Non-WebP upload is rejected

- **WHEN** a signed-in user uploads a profile image payload whose content type or magic bytes are not WebP
- **THEN** the endpoint SHALL reject the request
- **AND** the user's current profile image SHALL remain unchanged

#### Scenario: Oversized upload is rejected

- **WHEN** a signed-in user uploads a WebP profile image larger than 256 KB
- **THEN** the endpoint SHALL reject the request
- **AND** the user's current profile image SHALL remain unchanged

### Requirement: OAuth provider image import is best-effort initialization

The system SHALL use OAuth provider profile images only as a one-time account initialization source. Provider import SHALL run server-side, SHALL fetch the provider URL exactly as received without mutating size or format parameters, and SHALL never block account usability.

#### Scenario: New OAuth user starts avatar import

- **WHEN** a new OAuth user is created and the provider supplies a profile image URL
- **THEN** the system SHALL set `image` to null
- **AND** the system SHALL set `imageStatus` to `importing`
- **AND** the system SHALL store the provider URL in hidden server-only pending avatar state

#### Scenario: Provider import succeeds

- **WHEN** the server fetches a pending provider image with content type `image/jpeg`, `image/png`, or `image/webp` and a response body no larger than 1 MB
- **THEN** the system SHALL store the bytes in R2 under `avatars/{randomUUID}` with matching content type metadata
- **AND** the system SHALL set `image` to `/avatars/{randomUUID}`
- **AND** the system SHALL set `imageStatus` to `ready`
- **AND** the system SHALL clear the pending provider avatar URL

#### Scenario: Provider import fails validation

- **WHEN** the pending provider image fetch fails, has an unsupported or missing content type, or exceeds 1 MB
- **THEN** the system SHALL set `image` to null
- **AND** the system SHALL set `imageStatus` to `ready`
- **AND** the system SHALL clear the pending provider avatar URL

### Requirement: Avatar import status controls client refresh

The system SHALL expose `imageStatus` values `importing` and `ready` to the client. The client SHALL use `imageStatus` only to decide whether to briefly refresh account/session data while an import may complete.

#### Scenario: Client refreshes while import is pending

- **WHEN** the authenticated user's `imageStatus` is `importing`
- **THEN** the client SHALL render the current `image` value through the avatar component
- **AND** the client SHALL periodically refresh session or profile data for a bounded interval

#### Scenario: Client stops avatar import refresh

- **WHEN** the authenticated user's `imageStatus` is `ready`
- **THEN** the client SHALL NOT perform avatar-specific polling

### Requirement: Old avatar objects are cleaned up best-effort

The system SHALL treat avatar object cleanup as best-effort. Replacing or deleting a profile image SHALL update the user's profile state first and SHALL schedule old R2 object deletion asynchronously.

#### Scenario: Replacing avatar schedules old object deletion

- **WHEN** a signed-in user successfully replaces an existing profile image
- **THEN** the system SHALL update the user to point at the new avatar URL
- **AND** the system SHALL schedule deletion of the old R2 avatar object without blocking the response

#### Scenario: Deleting avatar schedules object deletion

- **WHEN** a signed-in user removes their profile image
- **THEN** the system SHALL set `image` to null
- **AND** the system SHALL set `imageStatus` to `ready`
- **AND** the system SHALL schedule deletion of the previous R2 avatar object without blocking the response

#### Scenario: Account deletion schedules avatar object deletion

- **WHEN** a user's account is permanently deleted
- **THEN** the system SHALL schedule deletion of the user's R2 avatar object without blocking the delete response
- **AND** the system SHALL NOT error if the user had no profile image at time of deletion

### Requirement: Avatar objects are served from R2

The system SHALL serve same-origin `/avatars/{randomUUID}` requests by reading the matching R2 object and returning its stored content type and cache metadata.

#### Scenario: Existing avatar is served

- **WHEN** the browser requests `/avatars/{randomUUID}` for an existing R2 object
- **THEN** the worker SHALL return the object bytes
- **AND** the response SHALL include the object's content type
- **AND** the response SHALL be cacheable as an immutable public asset

#### Scenario: Missing avatar returns not found

- **WHEN** the browser requests `/avatars/{randomUUID}` for a missing R2 object
- **THEN** the worker SHALL return a not found response
- **AND** the response SHALL NOT return the SPA HTML fallback

## MODIFIED Requirements

### Requirement: Avatar images are cached for offline display

The service worker SHALL runtime-cache same-origin `/avatars/*` image responses so previously viewed profile images remain visible while offline. The application SHALL clear the SW `'avatars'` cache on logout before signaling session removal to other tabs, ensuring no avatar data persists after sign-out.

#### Scenario: Viewed avatar remains available offline

- **WHEN** the app has successfully loaded a same-origin `/avatars/{randomUUID}` image while online
- **AND** the browser later loses network connectivity
- **THEN** the service worker SHALL be able to serve the cached avatar response for the same URL

#### Scenario: Avatar cache is cleared on logout

- **WHEN** the user signs out
- **THEN** the application SHALL delete the SW `'avatars'` cache before writing the session removal to localStorage
- **AND** subsequent requests for any `/avatars/*` URL SHALL NOT be served from the previous session's cached data

#### Scenario: Avatar cache ignores failed responses

- **WHEN** a `/avatars/{randomUUID}` request returns a non-success response
- **THEN** the service worker SHALL NOT store that response as a reusable avatar image

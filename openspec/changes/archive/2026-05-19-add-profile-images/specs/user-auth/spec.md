## ADDED Requirements

### Requirement: OAuth sign-up initializes app-owned avatar import

The system SHALL treat OAuth provider profile images as account initialization data only. On first OAuth user creation, the worker SHALL preserve the provider image URL in hidden server-only pending avatar state, SHALL expose only app-owned image data to the client, and SHALL NOT configure provider profile data to overwrite local profile images on later sign-ins.

#### Scenario: New OAuth user with provider image starts import

- **WHEN** a new user is created through Google or GitHub OAuth and the provider returns a profile image URL
- **THEN** the created user SHALL have `image` set to null
- **AND** the created user SHALL have `imageStatus` set to `importing`
- **AND** the provider image URL SHALL be stored in a field that is not accepted from client input and not returned in client API or session output

#### Scenario: New OAuth user without provider image is ready

- **WHEN** a new user is created through Google or GitHub OAuth and the provider does not return a profile image URL
- **THEN** the created user SHALL have `image` set to null
- **AND** the created user SHALL have `imageStatus` set to `ready`

#### Scenario: Later OAuth sign-in does not replace local profile image

- **WHEN** an existing OAuth-linked user signs in again after their provider profile image changed
- **THEN** the system SHALL sign in the existing local user through the linked provider account
- **AND** the system SHALL NOT overwrite the local `image` with the provider image URL or a newly imported provider image

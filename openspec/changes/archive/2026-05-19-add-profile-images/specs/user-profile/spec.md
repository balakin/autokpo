## MODIFIED Requirements

### Requirement: Avatar displays provider image or initials fallback

The profile button SHALL display the user's app-owned profile image when available, or an initials-based avatar when the image is null or fails to load. The profile button SHALL NOT render OAuth provider image URLs directly.

#### Scenario: User sees their app-owned profile image

- **WHEN** the authenticated user has a non-null app-owned `image` in the session
- **THEN** the avatar SHALL render the image URL

#### Scenario: Email OTP user sees initials avatar

- **WHEN** the authenticated user has a null `image` in the session
- **THEN** the avatar SHALL render a circle with the first character of the email address uppercased

#### Scenario: Initials avatar color is deterministic

- **WHEN** the initials avatar is rendered for a given user
- **THEN** the background color SHALL be derived from the user ID
- **AND** the same user SHALL always see the same color across sessions

#### Scenario: Image load failure falls back to initials

- **WHEN** the avatar `<img>` fails to load
- **THEN** the avatar SHALL fall back to the initials circle

#### Scenario: Provider image URL is ignored by avatar rendering

- **WHEN** OAuth avatar import is pending
- **THEN** the profile avatar SHALL NOT render a Google or GitHub provider image URL

## Purpose

Avatar upload and import are permanently disabled. Profile image storage, serving, upload, OAuth import, and related infrastructure have been removed.

## Requirements

### Requirement: Avatar upload and import are permanently disabled

The system SHALL NOT provide avatar upload, OAuth import, or avatar image serving. The `UserAvatar` component SHALL render initials fallback only. Clicking or tapping the avatar in the account settings page SHALL show a toast notification indicating the feature is unavailable.

#### Scenario: Avatar always shows initials

- **WHEN** any authenticated user is displayed in the UI (profile popover, settings page, encryption profile popover)
- **THEN** the `UserAvatar` component SHALL render a colored initial based on the user's email
- **AND** the component SHALL NOT render an image

#### Scenario: Settings avatar shows disabled tooltip on hover

- **WHEN** a signed-in user hovers over the avatar in the account settings page
- **THEN** a tooltip SHALL appear with the translated message indicating avatar changes are not available
- **AND** the avatar SHALL render initials (no image)

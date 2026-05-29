## MODIFIED Requirements

### Requirement: Account settings expose account identity and scoped actions

The Account settings tab SHALL display the signed-in user's server-backed account/profile data. Editable fields SHALL be limited to profile fields supported by the configured auth provider update API. Email SHALL be displayed read-only unless a separate verified email-change flow is introduced. The delete account action SHALL open the permanent account deletion confirmation flow when account settings are online and loaded. Avatar change, upload, crop, and removal SHALL NOT be available; the avatar SHALL render initials only with a disabled-state tooltip on hover.

#### Scenario: Email is displayed as account identity

- **WHEN** account settings load successfully for a user with an email address
- **THEN** the Account tab SHALL display the user's email address as account identity

#### Scenario: Email is not edited through profile update

- **WHEN** the Account tab displays editable profile fields
- **THEN** email SHALL NOT be presented as a normal profile-update field

#### Scenario: Account identity displays sync and online status

- **WHEN** account settings load successfully
- **THEN** the Account tab SHALL display the account identity with an online status indicator
- **AND** it SHALL display whether local data is synchronized or has unsynchronized changes

#### Scenario: Avatar shows initials and shows toast on click

- **WHEN** account settings load successfully
- **THEN** the avatar SHALL render initials only (no image)
- **AND** clicking or tapping the avatar SHALL show a toast notification indicating avatar changes are not available

#### Scenario: Avatar change action is not available

- **WHEN** account settings load successfully
- **THEN** the avatar SHALL NOT be clickable to open a file picker
- **AND** there SHALL be no avatar remove action

#### Scenario: Account deletion opens confirmation flow

- **WHEN** account settings load successfully
- **AND** the user activates the delete account action
- **THEN** the system SHALL open the permanent account deletion confirmation modal

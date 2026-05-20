## MODIFIED Requirements

### Requirement: Account settings expose account identity and scoped actions

The Account settings tab SHALL display the signed-in user's server-backed account/profile data. Editable fields SHALL be limited to profile fields supported by the configured auth provider update API and the profile-image change flow. Email SHALL be displayed read-only unless a separate verified email-change flow is introduced. The delete account action SHALL open the permanent account deletion confirmation flow when account settings are online and loaded.

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

#### Scenario: Avatar change opens image picker

- **WHEN** account settings load successfully
- **AND** the user activates the avatar change action
- **THEN** the system SHALL open the browser file picker from the existing avatar change button
- **AND** the file picker SHALL allow JPEG, PNG, and WebP source images

#### Scenario: Selected avatar opens crop modal

- **WHEN** the user selects a supported source image from the avatar file picker
- **THEN** the system SHALL open a modal containing a square avatar cropper
- **AND** the selected source image SHALL NOT be uploaded before the user confirms the crop

#### Scenario: Avatar crop can be cancelled

- **WHEN** the avatar crop modal is open
- **AND** the user cancels or dismisses the modal
- **THEN** the modal SHALL close
- **AND** the user's profile image SHALL remain unchanged

#### Scenario: Avatar change uploads normalized image

- **WHEN** the user confirms a selected avatar crop
- **THEN** the browser SHALL submit a normalized 512×512 WebP image to the profile image change endpoint
- **AND** the Account tab SHALL refresh displayed account data after the upload succeeds

#### Scenario: Avatar removal clears image

- **WHEN** account settings load successfully with a non-null profile image
- **AND** the user activates the remove avatar action
- **THEN** the system SHALL clear the user's profile image
- **AND** the avatar UI SHALL fall back to initials

#### Scenario: Account deletion opens confirmation flow

- **WHEN** account settings load successfully
- **AND** the user activates the delete account action
- **THEN** the system SHALL open the permanent account deletion confirmation modal

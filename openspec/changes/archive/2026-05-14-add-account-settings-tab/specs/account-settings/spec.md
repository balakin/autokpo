## ADDED Requirements

### Requirement: Account settings tab is available inside Settings

The system SHALL provide an Account settings tab at `/settings/account` inside the shared Settings layout. The Account tab SHALL be intended for signed-in account/profile settings and SHALL be separate from General app settings.

#### Scenario: Account settings route renders account tab

- **WHEN** a signed-in user navigates to `/settings/account`
- **THEN** the Settings layout SHALL render with the Account tab selected
- **AND** the page SHALL display account settings content

#### Scenario: Account settings does not replace general settings

- **WHEN** a signed-in user navigates between `/settings/general` and `/settings/account`
- **THEN** both routes SHALL remain under the same Settings layout
- **AND** the selected tab SHALL determine which settings content is visible

### Requirement: Account settings are unavailable offline

The Account settings tab SHALL require internet access. When the browser is offline, account settings SHALL NOT issue a profile/account query and SHALL show an inline message explaining that account settings are unavailable without internet.

#### Scenario: Offline account settings shows unavailable state

- **WHEN** the user navigates to `/settings/account`
- **AND** the browser is offline
- **THEN** the Account tab SHALL display a message that account settings are not available without internet
- **AND** no account profile query SHALL run

#### Scenario: Online account settings runs account query

- **WHEN** the user navigates to `/settings/account`
- **AND** the browser is online
- **THEN** the Account tab SHALL run a React Query query for the current account/profile settings

#### Scenario: Online account settings shows loading state

- **WHEN** the user navigates to `/settings/account`
- **AND** the browser is online
- **AND** the account/profile query is pending
- **THEN** the Account tab SHALL display an account loading state

#### Scenario: Online account settings shows load error state

- **WHEN** the user navigates to `/settings/account`
- **AND** the browser is online
- **AND** the account/profile query fails
- **THEN** the Account tab SHALL display an inline error explaining that the account could not be loaded

### Requirement: Account settings expose account identity and scoped actions

The Account settings tab SHALL display the signed-in user's server-backed account/profile data. Editable fields SHALL be limited to profile fields supported by the configured auth provider update API. Email SHALL be displayed read-only unless a separate verified email-change flow is introduced. Actions that are visible but not implemented in this change SHALL communicate their unavailable status instead of mutating account data.

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

#### Scenario: Avatar change is unavailable placeholder

- **WHEN** account settings load successfully
- **AND** the user activates the avatar change action
- **THEN** the system SHALL explain that changing the profile image is not available yet

#### Scenario: Account deletion is unavailable placeholder

- **WHEN** account settings load successfully
- **AND** the user activates the delete account action
- **THEN** the system SHALL explain that deleting the account is not available yet

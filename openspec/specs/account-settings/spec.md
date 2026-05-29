## Purpose

Define the Account settings tab behavior inside the shared Settings area, including online-only account/profile loading and scoped account actions.

## Requirements

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

### Requirement: Account settings includes session management

The Account settings tab SHALL include a Sessions card when online account settings are loaded. The Sessions card SHALL appear alongside existing account identity and account deletion controls and SHALL follow the Account settings online-only behavior.

#### Scenario: Online account settings displays sessions card

- **WHEN** a signed-in user navigates to `/settings/account`
- **AND** the browser is online
- **AND** account settings load successfully
- **THEN** the Account tab SHALL display a Sessions card

#### Scenario: Offline account settings does not load sessions

- **WHEN** the user navigates to `/settings/account`
- **AND** the browser is offline
- **THEN** the Account tab SHALL show the existing offline unavailable state
- **AND** the system SHALL NOT issue a sessions query

#### Scenario: Account settings session loading failure is contained

- **WHEN** account settings load successfully
- **AND** the sessions query fails
- **THEN** the Account tab SHALL keep the existing account identity controls available
- **AND** the Sessions card SHALL show an inline sessions error state

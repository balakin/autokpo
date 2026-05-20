## ADDED Requirements

### Requirement: Profile panel links to account settings

The profile panel SHALL provide an account settings action that navigates to `/settings/account`. The action SHALL be available from both the desktop popover and the mobile drawer variants of the profile panel.

#### Scenario: Desktop profile panel opens account settings

- **WHEN** a signed-in desktop user opens the profile popover
- **AND** activates the account settings action
- **THEN** the application SHALL navigate to `/settings/account`

#### Scenario: Mobile profile panel opens account settings

- **WHEN** a signed-in mobile user opens the profile drawer
- **AND** activates the account settings action
- **THEN** the application SHALL navigate to `/settings/account`

#### Scenario: Account settings action remains available offline

- **WHEN** the profile panel is open and the browser is offline
- **THEN** the account settings action SHALL remain available
- **AND** navigating to `/settings/account` SHALL allow the Account tab to explain the offline limitation

## MODIFIED Requirements

### Requirement: Profile panel handles sign-out safely

The profile panel SHALL provide sign-out from the signed-in user panel. Sign-out SHALL require internet access and SHALL protect users from accidentally signing out while local changes remain unsynchronized.

#### Scenario: Sign-out is disabled offline

- **WHEN** the profile panel is open and the browser is offline
- **THEN** the profile panel SHALL show a warning that sign-out requires internet access
- **AND** the sign-out action SHALL be disabled

#### Scenario: Sign-out proceeds online with synchronized data

- **WHEN** the profile panel is open and the browser is online
- **AND** local data is synchronized
- **AND** the user activates sign-out
- **THEN** the application SHALL call the auth logout flow

#### Scenario: Sign-out confirms unsynchronized changes

- **WHEN** the profile panel is open and the browser is online
- **AND** local data has unsynchronized changes
- **AND** the user activates sign-out
- **THEN** the application SHALL show a confirmation dialog warning about unsynchronized changes
- **AND** confirming the dialog SHALL call the auth logout flow

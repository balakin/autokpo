## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Settings page displays configuration sections

The system SHALL render a Settings area with route-backed tabs. `/settings` SHALL redirect to `/settings/general`. The General tab at `/settings/general` SHALL display sections for Theme, Language, and Data. The Account tab at `/settings/account` SHALL display account settings content. The Security tab at `/settings/security` SHALL display local unlock method settings. The Language section SHALL contain a functional locale selector. The Theme section SHALL contain a functional theme selector. The Data section SHALL display a manual sync action, a functional state export action, and a localized last successful sync status for this device. Sign-out SHALL be available from the profile avatar popover in the app top bar rather than from Settings. Timestamp rendering for the sync status SHALL rely on platform internationalization APIs and SHALL NOT require `date-fns`.

#### Scenario: Settings redirects to general tab

- **WHEN** the user navigates to `/settings`
- **THEN** the application SHALL redirect to `/settings/general`

#### Scenario: General settings tab renders with all sections

- **WHEN** the user navigates to `/settings/general`
- **THEN** the page SHALL display sections labeled with translated strings for "Theme", "Language", and "Data"
- **AND** the General tab SHALL be selected

#### Scenario: Account settings tab is reachable from Settings

- **WHEN** the user navigates to `/settings/account`
- **THEN** the Settings area SHALL render the Account tab as selected
- **AND** the General tab content SHALL NOT be visible

#### Scenario: Security settings tab is reachable from Settings

- **WHEN** the user navigates to `/settings/security`
- **THEN** the Settings area SHALL render the Security tab as selected
- **AND** the Security tab content SHALL be visible

#### Scenario: Settings tab navigation shows three tabs

- **WHEN** the user is on any Settings page
- **THEN** the tab navigation SHALL display tabs for General, Account, and Security

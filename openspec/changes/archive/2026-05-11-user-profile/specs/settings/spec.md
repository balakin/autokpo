## MODIFIED Requirements

### Requirement: Settings page displays configuration sections

The system SHALL render a Settings page at `/settings` with sections for Theme, Language, and Data. The Language section SHALL contain a functional locale selector. The Theme section SHALL contain a functional theme selector. The Data section SHALL display a manual sync action, placeholders for export/import/clear actions, and a localized last successful sync status for this device. Timestamp rendering for the sync status SHALL rely on platform internationalization APIs and SHALL NOT require `date-fns`.

The sign-out action SHALL NOT appear on the Settings page. Sign-out is accessible exclusively through the profile popover in the top bar.

#### Scenario: Settings page renders with all sections

- **WHEN** the user navigates to `/settings`
- **THEN** the page SHALL display sections labeled with translated strings for "Theme", "Language", and "Data"

#### Scenario: Theme section contains a Select control

- **WHEN** the settings page is rendered
- **THEN** the Theme section SHALL display a `Select` component with translated options for light, dark, and system themes
- **AND** the Select SHALL show the currently active preference as its selected value
- **AND** the default selected value SHALL be the system theme when no preference has been stored

#### Scenario: Selecting a theme updates the active theme

- **WHEN** the user selects an option from the theme Select
- **THEN** the active theme SHALL change immediately
- **AND** the preference SHALL be persisted to localStorage

#### Scenario: Language section contains a locale selector

- **WHEN** the settings page is rendered
- **THEN** the Language section SHALL display a `Select` component with options for all supported locales
- **AND** the Select SHALL show the currently active locale as its selected value

#### Scenario: Selecting a locale updates the application language

- **WHEN** the user selects a locale from the Language Select
- **THEN** all translatable strings in the application SHALL immediately update to the selected locale
- **AND** the locale preference SHALL be persisted to localStorage under the key `autokpo:locale`

#### Scenario: Data section does not contain a sign-out action

- **WHEN** the settings page is rendered
- **THEN** the Data section SHALL NOT display a sign-out button

#### Scenario: Data section shows last successful sync

- **WHEN** the settings page is rendered after this device has completed at least one successful sync
- **THEN** the Data section SHALL display the last successful sync status for this device under the action buttons

#### Scenario: Recent sync uses localized relative time

- **WHEN** the last successful sync is less than one day old
- **THEN** the Data section SHALL display a localized relative value
- **AND** the relative value SHALL refresh on a bounded timer cadence

#### Scenario: Older sync uses exact localized date/time

- **WHEN** the last successful sync is one day old or older
- **THEN** the Data section SHALL display an exact localized date/time value

#### Scenario: Data section handles missing sync history

- **WHEN** the settings page is rendered before this device has completed any successful sync
- **THEN** the Data section SHALL communicate that no successful sync has happened yet

#### Scenario: Data section placeholder actions remain disabled

- **WHEN** the settings page is rendered
- **THEN** the Data section SHALL display placeholders for export, import, and clear data actions with no functional behavior

#### Scenario: No visible page heading

- **WHEN** the settings page is rendered
- **THEN** the page SHALL NOT display a visible icon + heading row at the top
- **AND** the page SHALL contain a visually-hidden `<h1>` with the translated equivalent of "Settings"

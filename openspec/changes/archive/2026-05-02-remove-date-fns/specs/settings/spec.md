## MODIFIED Requirements

### Requirement: Settings page displays configuration sections

The system SHALL render a Settings page at `/settings` with sections for Theme, Language, and Data. The Language section SHALL contain a functional locale selector. The Theme section SHALL contain a functional theme selector. The Data section SHALL display a manual sync action, placeholders for export/import/clear actions, and a localized last successful sync status for this device. Timestamp rendering for the sync status SHALL rely on platform internationalization APIs and SHALL NOT require `date-fns`.

#### Scenario: Settings page renders with all sections

- **WHEN** the user navigates to `/settings`
- **THEN** the page SHALL display sections labeled with translated strings for "Theme", "Language", and "Data"

#### Scenario: Theme section contains a Select control

- **WHEN** the settings page is rendered
- **THEN** the Theme section SHALL display a `Select` component with translated options for light ("Svetla" / "Light" / "Светлая"), dark ("Tamna" / "Dark" / "Тёмная"), and system ("Sistemska" / "System" / "Системная") themes
- **AND** the Select SHALL show the currently active preference as its selected value
- **AND** the default selected value SHALL be "Sistemska" (or locale equivalent) when no preference has been stored

#### Scenario: Selecting a theme updates the active theme

- **WHEN** the user selects an option from the theme Select
- **THEN** the active theme SHALL change immediately
- **AND** the preference SHALL be persisted to localStorage

#### Scenario: Language section contains a locale selector

- **WHEN** the settings page is rendered
- **THEN** the Language section SHALL display a `Select` component with options for "Srpski" (sr-Latn), "English" (en), and "Русский" (ru)
- **AND** the Select SHALL show the currently active locale as its selected value
- **AND** the description text SHALL indicate the current language name in the current locale

#### Scenario: Selecting a locale updates the application language

- **WHEN** the user selects a locale from the Language Select
- **THEN** all translatable strings in the application SHALL immediately update to the selected locale
- **AND** the locale preference SHALL be persisted to localStorage under the key `autokpo:locale`

#### Scenario: Data section shows last successful sync

- **WHEN** the settings page is rendered after this device has completed at least one successful sync
- **THEN** the Data section SHALL display the last successful sync status for this device under the action buttons

#### Scenario: Recent sync uses localized relative time

- **WHEN** the last successful sync is less than one day old
- **THEN** the Data section SHALL display a localized relative value (for example "5 minutes ago")
- **AND** the relative value SHALL refresh on a bounded timer cadence (5s while <1 minute old, then 30s until one day)

#### Scenario: Older sync uses exact localized date/time

- **WHEN** the last successful sync is one day old or older
- **THEN** the Data section SHALL display an exact localized date/time value
- **AND** the status component SHALL stop timer-based refreshes

#### Scenario: Slight future skew does not show future phrasing

- **WHEN** local render time is slightly behind `lastSuccessfulSyncAt`
- **THEN** the Data section SHALL avoid future phrasing and display a past-oriented relative value

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

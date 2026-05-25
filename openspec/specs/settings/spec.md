## Purpose

Define the Settings area behavior for route-backed General and Account tabs, theme, language, and sync-status presentation and interactions.

## Requirements

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

#### Scenario: Theme section contains a Select control

- **WHEN** the general settings tab is rendered
- **THEN** the Theme section SHALL display a `Select` component with translated options for light ("Svetla" / "Light" / "Светлая"), dark ("Tamna" / "Dark" / "Тёмная"), and system ("Sistemska" / "System" / "Системная") themes
- **AND** the Select SHALL show the currently active preference as its selected value
- **AND** the default selected value SHALL be "Sistemska" (or locale equivalent) when no preference has been stored

#### Scenario: Selecting a theme updates the active theme

- **WHEN** the user selects an option from the theme Select
- **THEN** the active theme SHALL change immediately
- **AND** the preference SHALL be persisted to localStorage

#### Scenario: Language section contains a locale selector

- **WHEN** the general settings tab is rendered
- **THEN** the Language section SHALL display a `Select` component with options for "Srpski" (sr-Latn), "English" (en), and "Русский" (ru)
- **AND** the Select SHALL show the currently active locale as its selected value
- **AND** the description text SHALL indicate the current language name in the current locale

#### Scenario: Selecting a locale updates the application language

- **WHEN** the user selects a locale from the Language Select
- **THEN** all translatable strings in the application SHALL immediately update to the selected locale
- **AND** the locale preference SHALL be persisted to localStorage under the key `autokpo:locale`

#### Scenario: Data section excludes sign-out action

- **WHEN** the general settings tab is rendered for a signed-in user
- **THEN** the Data section SHALL NOT display a sign-out action

#### Scenario: Sign-out is routed to profile popover

- **WHEN** the user wants to sign out
- **THEN** sign-out SHALL be accessible through the profile avatar popover in the top bar
- **AND** the Settings page SHALL NOT contain a sign-out action

#### Scenario: Data section shows last successful sync

- **WHEN** the general settings tab is rendered after this device has completed at least one successful sync
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

- **WHEN** the general settings tab is rendered before this device has completed any successful sync
- **THEN** the Data section SHALL communicate that no successful sync has happened yet

#### Scenario: Data section sync action is functional

- **WHEN** the general settings tab is rendered
- **THEN** the Data section SHALL display a sync-now action
- **AND** activating it SHALL trigger the application sync flow

#### Scenario: Data section contains only sync and state export actions

- **WHEN** the general settings tab is rendered
- **THEN** the Data section SHALL display a sync-now action and a state export action
- **AND** the Data section SHALL NOT display import or clear-data actions

#### Scenario: No visible page heading

- **WHEN** the Settings area is rendered
- **THEN** the page SHALL NOT display a visible icon + heading row at the top
- **AND** the page SHALL contain a visually-hidden `<h1>` with the translated equivalent of "Settings"

### Requirement: Locale preference is persisted and switchable

The system SHALL persist the selected locale to `localStorage` under the key `autokpo:locale`. When the user switches locale, the application SHALL immediately re-render with the new locale's translations without a page reload.

#### Scenario: User switches locale

- **WHEN** the user selects a different locale from the Settings page
- **THEN** all translatable strings in the application SHALL immediately update to the new locale
- **AND** the selected locale SHALL be persisted to `localStorage` under the key `autokpo:locale`

#### Scenario: Locale persists across sessions

- **WHEN** the user closes and reopens the application
- **THEN** the application SHALL render with the locale stored in `localStorage`
- **AND** if no stored locale exists, `sr-Latn` SHALL be used

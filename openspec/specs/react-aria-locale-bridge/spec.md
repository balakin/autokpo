## ADDED Requirements

### Requirement: React Aria locale context follows app locale

The system SHALL provide a React Aria `I18nProvider` locale context derived from the active app locale so date/time components render with the same locale selection used by application translations.

#### Scenario: Date/time locale context is provided for app subtree

- **WHEN** the application renders under `LocaleProvider`
- **THEN** descendants SHALL receive React Aria locale context via `I18nProvider` from `react-aria-components`
- **AND** the provider locale value SHALL be resolved from the active app locale using the app's locale-to-Intl mapping

#### Scenario: Locale switch updates date/time rendering context

- **WHEN** the user changes locale through app controls
- **THEN** the React Aria locale context SHALL update in the same render cycle as locale state
- **AND** date/time components using React Aria internationalization SHALL re-render according to the newly selected locale

#### Scenario: Browser locale does not override selected app locale

- **WHEN** the browser default locale differs from the selected app locale
- **THEN** React Aria date/time components SHALL use the selected app locale context rather than browser-default locale behavior

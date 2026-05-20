## MODIFIED Requirements

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

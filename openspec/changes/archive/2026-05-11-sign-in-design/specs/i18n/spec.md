## MODIFIED Requirements

### Requirement: Auth page exposes locale and theme selectors

The system SHALL render locale and theme selector controls on the auth page (`AuthEntry`). These controls SHALL use `useLocale()` and `useTheme()` from their respective providers and write changes via `setLocale` and `setTheme`, which persist to `localStorage`.

The auth page SHALL present these controls as compact app-level header controls rather than as primary form fields in the sign-in card. The controls SHALL remain accessible through localized names, and all new auth page copy SHALL use Serbian Latin as source text wrapped in Lingui macros.

#### Scenario: User changes locale on the auth page

- **WHEN** the user selects a locale from the selector on the auth page
- **THEN** the auth page SHALL immediately re-render with the selected locale's translations
- **AND** the preference SHALL be persisted to `localStorage` under `autokpo:locale`

#### Scenario: User changes theme on the auth page

- **WHEN** the user selects a theme from the selector on the auth page
- **THEN** the active theme SHALL change immediately
- **AND** the preference SHALL be persisted to `localStorage` under `autokpo:theme`

#### Scenario: Auth page preferences are header-level controls

- **WHEN** a signed-out user opens `/sign-in`
- **THEN** the locale and theme controls SHALL be presented in the page header area
- **AND** they SHALL NOT be presented as part of the email sign-in form

#### Scenario: New auth copy is localized

- **WHEN** new user-visible auth page text is added
- **THEN** the source text SHALL be Serbian Latin
- **AND** the text SHALL be extracted through Lingui macros for all supported locales

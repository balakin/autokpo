## MODIFIED Requirements

### Requirement: I18nProvider wraps the application at root level

The system SHALL render `LocaleProvider` above the router, outside `AuthProvider` and `SignedInApp`, so that locale is available on the auth page. `LocaleProvider` SHALL NOT depend on the CRDT doc — it reads from `localStorage` only. The `I18nProvider` from `@lingui/react` SHALL remain at the root of the application. `LocaleProvider` SHALL also provide React Aria locale context for descendants by rendering `I18nProvider` from `react-aria-components` with a locale derived from the active app locale using `INTL_LOCALES`. On initial load, `LocaleProvider` SHALL read the `autokpo:locale` key from `localStorage`; if absent or invalid, it SHALL fall back to the best-match supported locale from `navigator.language`, then `sr-Latn` if no match is found.

#### Scenario: Locale is loaded from localStorage on mount

- **WHEN** the application mounts
- **THEN** `LocaleProvider` SHALL read the `autokpo:locale` key from `localStorage`
- **AND** if a valid locale value (`sr-Latn`, `en`, or `ru`) is found, that locale SHALL be activated
- **AND** if no value or an invalid value is found, `navigator.language` SHALL be consulted for a supported match
- **AND** if no supported match is found, `sr-Latn` SHALL be used as the final fallback

#### Scenario: navigator.language fallback matches a supported locale

- **WHEN** `localStorage` has no stored locale
- **AND** `navigator.language` is `'en'` or begins with `'en-'`
- **THEN** `LocaleProvider` SHALL activate the `'en'` locale

#### Scenario: navigator.language fallback has no supported match

- **WHEN** `localStorage` has no stored locale
- **AND** `navigator.language` is a language not in `['sr-Latn', 'en', 'ru']`
- **THEN** `LocaleProvider` SHALL activate `'sr-Latn'`

#### Scenario: Provider hierarchy

- **WHEN** the application mounts
- **THEN** the provider order SHALL be `StrictMode → I18nProvider (@lingui/react) → LocaleProvider → ThemeProvider → Router → AuthProvider → …`
- **AND** `LocaleProvider` SHALL provide nested React Aria `I18nProvider` context to all descendants that render date/time UI
- **AND** `LocaleProvider` SHALL NOT appear inside `SignedInApp`

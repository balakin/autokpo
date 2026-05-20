## MODIFIED Requirements

### Requirement: I18nProvider wraps the application at root level

The system SHALL render an `I18nProvider` from `@lingui/react` at the root of the application, inside `StrictMode` and outside `ThemeProvider`. A `LocaleProvider` SHALL sit inside `I18nProvider` to manage locale state and `localStorage` persistence. The `I18nProvider` SHALL initialize with the locale persisted in `localStorage` under the key `autokpo:locale`, falling back to `sr-Latn` if no preference is stored.

#### Scenario: Locale is loaded from localStorage on mount

- **WHEN** the application mounts
- **THEN** the `LocaleProvider` SHALL read the `autokpo:locale` key from `localStorage`
- **AND** if a valid locale value (`sr-Latn`, `en`, or `ru`) is found, that locale SHALL be activated
- **AND** if no value or an invalid value is found, `sr-Latn` SHALL be used as the default

#### Scenario: Provider hierarchy

- **WHEN** the application mounts
- **THEN** the provider order SHALL be `StrictMode → I18nProvider → LocaleProvider → ThemeProvider → (Toast.Provider, BooksProvider, RouterProvider)`

## MODIFIED Requirements

### Requirement: I18nProvider wraps the application at root level

The system SHALL render `LocaleProvider` above the router, outside `AuthProvider` and `SignedInApp`, so that locale is available on the auth page. `LocaleProvider` SHALL NOT depend on the CRDT doc — it reads from `localStorage` only. The `I18nProvider` from `@lingui/react` SHALL remain at the root of the application. `LocaleProvider` SHALL also provide React Aria locale context for descendants by rendering `I18nProvider` from `react-aria-components` with a locale derived from the active app locale using `INTL_LOCALES`. On initial load, `LocaleProvider` SHALL read the `autokpo:locale` key from `localStorage`; if absent or invalid, it SHALL check the `?lang=` query parameter for a valid locale hint; if also absent or invalid, it SHALL fall back to the best-match supported locale from `navigator.language`, then `en` if no match is found. After consuming the `?lang=` hint (and persisting the resolved locale to localStorage), the system SHALL clean the `?lang=` parameter from the URL via `history.replaceState`.

#### Scenario: Locale is loaded from localStorage on mount

- **WHEN** the application mounts
- **THEN** `LocaleProvider` SHALL read the `autokpo:locale` key from `localStorage`
- **AND** if a valid locale value (`sr-Latn`, `en`, or `ru`) is found, that locale SHALL be activated
- **AND** the `?lang=` query parameter SHALL NOT be consulted

#### Scenario: Query parameter hint is consumed when localStorage is empty

- **WHEN** `localStorage` has no stored locale
- **AND** the URL includes a valid `?lang=` query parameter (`sr-Latn`, `en`, or `ru`)
- **THEN** `LocaleProvider` SHALL activate the hinted locale
- **AND** the locale SHALL be persisted to `localStorage` under `autokpo:locale`
- **AND** the `?lang=` parameter SHALL be removed from the URL via `history.replaceState`

#### Scenario: Invalid query parameter is ignored

- **WHEN** `localStorage` has no stored locale
- **AND** the URL includes a `?lang=` value that is not one of `sr-Latn`, `en`, or `ru`
- **THEN** `LocaleProvider` SHALL fall through to `navigator.language` resolution
- **AND** the `?lang=` parameter SHALL still be removed from the URL

#### Scenario: navigator.language fallback matches a supported locale

- **WHEN** `localStorage` has no stored locale and no valid `?lang=` hint is present
- **AND** `navigator.language` is `'en'` or begins with `'en-'`
- **THEN** `LocaleProvider` SHALL activate the `'en'` locale

#### Scenario: navigator.language fallback has no supported match

- **WHEN** `localStorage` has no stored locale and no valid `?lang=` hint is present
- **AND** `navigator.language` is a language not in `['sr-Latn', 'en', 'ru']`
- **THEN** `LocaleProvider` SHALL activate `'en'`

#### Scenario: Provider hierarchy

- **WHEN** the application mounts
- **THEN** the provider order SHALL be `StrictMode → I18nProvider (@lingui/react) → LocaleProvider → ThemeProvider → Router → AuthProvider → …`
- **AND** `LocaleProvider` SHALL provide nested React Aria `I18nProvider` context to all descendants that render date/time UI
- **AND** `LocaleProvider` SHALL NOT appear inside `SignedInApp`

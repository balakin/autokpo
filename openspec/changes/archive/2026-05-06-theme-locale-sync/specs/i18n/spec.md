## MODIFIED Requirements

### Requirement: I18nProvider wraps the application at root level

The system SHALL render `LocaleProvider` above the router, outside `AuthProvider` and `SignedInApp`, so that locale is available on the auth page. `LocaleProvider` SHALL NOT depend on the CRDT doc — it reads from `localStorage` only. The `I18nProvider` from `@lingui/react` SHALL remain at the root of the application. On initial load, `LocaleProvider` SHALL read the `autokpo:locale` key from `localStorage`; if absent or invalid, it SHALL fall back to the best-match supported locale from `navigator.language`, then `sr-Latn` if no match is found.

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
- **THEN** the provider order SHALL be `StrictMode → I18nProvider → LocaleProvider → ThemeProvider → Router → AuthProvider → …`
- **AND** `LocaleProvider` SHALL NOT appear inside `SignedInApp`

## ADDED Requirements

### Requirement: Locale syncs across open tabs via storage event

The system SHALL add a `storage` event listener in `LocaleProvider` that reacts to changes to the `autokpo:locale` key in `localStorage`. When another tab writes a new locale (either from a direct user action or from `LocaleSynchronizer` propagating a CRDT update), the listening tab SHALL update its locale state and activate the new locale in the i18n runtime.

#### Scenario: Locale change in one tab propagates to other tabs

- **WHEN** the user changes the locale in one browser tab
- **THEN** all other open tabs SHALL immediately activate the new locale
- **AND** all translatable strings SHALL re-render in the new locale without a page reload

#### Scenario: storage event for unrelated key is ignored

- **WHEN** a `storage` event fires for a key other than `autokpo:locale`
- **THEN** `LocaleProvider` SHALL NOT update its state or call `i18n.activate`

### Requirement: Auth page exposes locale and theme selectors

The system SHALL render draft locale and theme selector controls on the auth page (`AuthEntry`). These controls SHALL use `useLocale()` and `useTheme()` from their respective providers and write changes via `setLocale` and `setTheme`, which persist to `localStorage`.

#### Scenario: User changes locale on the auth page

- **WHEN** the user selects a locale from the selector on the auth page
- **THEN** the auth page SHALL immediately re-render with the selected locale's translations
- **AND** the preference SHALL be persisted to `localStorage` under `autokpo:locale`

#### Scenario: User changes theme on the auth page

- **WHEN** the user selects a theme from the selector on the auth page
- **THEN** the active theme SHALL change immediately
- **AND** the preference SHALL be persisted to `localStorage` under `autokpo:theme`

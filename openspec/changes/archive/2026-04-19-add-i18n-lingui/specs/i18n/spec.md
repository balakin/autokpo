## ADDED Requirements

### Requirement: Lingui provides internationalization infrastructure

The system SHALL use Lingui (`@lingui/core`, `@lingui/react`, `@lingui/babel-plugin-lingui-macro`, `@lingui/cli`, `@lingui/vite-plugin`) as the i18n framework. Catalog format SHALL be PO (Lingui default — no explicit `format` key). Base locale SHALL be `sr-Latn`. Supported locales SHALL be `sr-Latn`, `en`, and `ru`.

#### Scenario: Lingui is configured in lingui.config.ts

- **WHEN** the application is built or developed
- **THEN** `lingui.config.ts` SHALL define `locales: ['sr-Latn', 'en', 'ru']`, `sourceLocale: 'sr-Latn'`, and `catalogs` pointing to `src/locales/{locale}`
- **AND** `@lingui/vite-plugin` SHALL be configured in `vite.config.ts` for HMR, with `@lingui/babel-plugin-lingui-macro` in `@rolldown/plugin-babel` alongside the React Compiler preset

#### Scenario: Package scripts for Lingui are available

- **WHEN** a developer runs `pnpm i18n:extract`
- **THEN** `lingui extract --clean` SHALL scan all source files for `<Trans>` and `t` macro usage and update PO catalogs

Note: There is no `i18n:compile` script. The `@lingui/vite-plugin` compiles catalogs on-the-fly during dev and build, with `failOnMissing: true` and `failOnCompileError: true` enforcing completeness.

---

### Requirement: Translation catalogs are PO files in src/locales/

The system SHALL store translations as PO files at `src/locales/{locale}.po`. Catalogs SHALL be committed to the repository. The base locale (`sr-Latn.po`) SHALL contain all keys with Serbian Latin values. Other locale files SHALL contain the same keys with translated values.

#### Scenario: Catalog file structure

- **WHEN** `pnpm i18n:extract` is run
- **THEN** catalog files SHALL be created/updated at `src/locales/sr-Latn.po`, `src/locales/en.po`, and `src/locales/ru.po`
- **AND** each file SHALL follow PO format with `msgid` / `msgstr` pairs and plural form metadata

#### Scenario: Missing translations are detected

- **WHEN** a translation key exists in the base locale but `msgstr` is empty in a target locale
- **THEN** `@lingui/vite-plugin` with `failOnMissing: true` SHALL fail the build or dev server

---

### Requirement: I18nProvider wraps the application at root level

The system SHALL render an `I18nProvider` from `@lingui/react` at the root of the application, inside `StrictMode` and outside `ThemeProvider`. A `LocaleProvider` SHALL sit inside `I18nProvider` to manage locale state and `localStorage` persistence. The `I18nProvider` SHALL initialize with the locale persisted in `localStorage` under the key `kpo:locale`, falling back to `sr-Latn` if no preference is stored.

#### Scenario: Locale is loaded from localStorage on mount

- **WHEN** the application mounts
- **THEN** the `LocaleProvider` SHALL read the `kpo:locale` key from `localStorage`
- **AND** if a valid locale value (`sr-Latn`, `en`, or `ru`) is found, that locale SHALL be activated
- **AND** if no value or an invalid value is found, `sr-Latn` SHALL be used as the default

#### Scenario: Provider hierarchy

- **WHEN** the application mounts
- **THEN** the provider order SHALL be `StrictMode → I18nProvider → LocaleProvider → ThemeProvider → (Toast.Provider, BooksProvider, RouterProvider)`

---

### Requirement: Locale preference is persisted and switchable

The system SHALL persist the selected locale to `localStorage` under the key `kpo:locale`. When the user switches locale, the application SHALL immediately re-render with the new locale's translations without a page reload.

#### Scenario: User switches locale

- **WHEN** the user selects a different locale from the Settings page
- **THEN** all translatable strings in the application SHALL immediately update to the new locale
- **AND** the selected locale SHALL be persisted to `localStorage` under the key `kpo:locale`

#### Scenario: Locale persists across sessions

- **WHEN** the user closes and reopens the application
- **THEN** the application SHALL render with the locale stored in `localStorage`
- **AND** if no stored locale exists, `sr-Latn` SHALL be used

---

### Requirement: All UI strings are extracted via Lingui macros

The system SHALL use Lingui's `<Trans>` component and `t` macro for all user-visible strings in `src/` excluding `src/pdf/` (PDF generation internals) and `src/formatters.ts`. The button label in `src/pdf/download-pdf-button.tsx` IS internationalized because it is user-facing UI text, not legal form content. Strings that require interpolation or pluralization SHALL use ICU MessageFormat syntax within macros.

#### Scenario: Simple string extraction

- **WHEN** a component renders a static label like "Sačuvaj"
- **THEN** the label SHALL be wrapped as `<Trans>Sačuvaj</Trans>` or `t\`Sačuvaj\`` depending on context

#### Scenario: Interpolated string extraction

- **WHEN** a component renders a dynamic string like `` `Knjiga sadrži ${count} unosa` ``
- **THEN** the string SHALL be extracted using `<Trans>Knjiga sadrži <span>{count}</span> unosa</Trans>` or equivalent macro syntax with the value passed as a prop

#### Scenario: Pluralized string extraction

- **WHEN** a component renders a count-dependent string like "unosa" (which varies: 1 unos, 2 unosa, 5 unosa)
- **THEN** the string SHALL use ICU plural syntax via Lingui's `<Plural>` component or `plural` macro

#### Scenario: aria-label extraction

- **WHEN** a component sets an aria-label like `"Uredi"`
- **THEN** the aria-label value SHALL be extracted using `t\`Uredi\``

---

### Requirement: Zod schemas use factory pattern for locale-aware validation

Each Zod schema that contains user-facing validation messages SHALL be converted from a module-scope constant to a factory function. The factory SHALL use `t` from `@lingui/core/macro` directly (no arguments) — `t` resolves against the active locale at call time.

#### Scenario: Schema factory uses t macro

- **WHEN** a component needs a Zod schema for form validation
- **THEN** the component SHALL call the schema factory with no arguments: `createEntrySchema()`
- **AND** validation error messages SHALL be in the currently active locale

#### Scenario: Factory produces valid Zod schema

- **WHEN** `createEntrySchema()` is called
- **THEN** the returned value SHALL be a valid Zod schema compatible with `react-hook-form`'s `zodResolver`

---

### Requirement: ESLint enforces Lingui best practices

The system SHALL configure `eslint-plugin-lingui` with the `flat/recommended` config in the ESLint configuration. Additionally, `lingui/consistent-plural-format` SHALL be set to `'warn'` and `lingui/no-plural-inside-trans` SHALL be set to `'warn'`. These rules SHALL apply to all files in `src/`. The `no-unlocalized-strings` rule is intentionally NOT enabled because it produces too many false positives with HeroUI component props and Tailwind class strings.

#### Scenario: Lingui ESLint rules are active

- **WHEN** a developer runs the linter
- **THEN** `eslint-plugin-lingui` recommended rules SHALL be enforced
- **AND** `lingui/consistent-plural-format` SHALL warn on non-standard plural patterns
- **AND** `lingui/no-plural-inside-trans` SHALL warn when `<Plural>` is nested inside `<Trans>`

#### Scenario: Unlocalized strings are caught by extraction, not lint

- **WHEN** a developer adds a new `<Trans>` or `t` macro call without providing translations for all locales
- **THEN** `pnpm i18n:extract` SHALL update the PO catalogs and the pre-commit hook SHALL stage the changes
- **AND** missing or empty translations SHALL be caught during code review rather than by an ESLint rule

---

### Requirement: Pre-commit hook keeps catalogs in sync

The pre-commit hook SHALL run `pnpm lint-staged` followed by `pnpm i18n:extract` and then `git add src/locales/`. This ensures PO catalogs are automatically updated and staged whenever source files containing Lingui macros are committed. The Vite plugin's `failOnMissing` and `failOnCompileError` options enforce translation completeness at build/dev time.

#### Scenario: Catalogs are updated on commit

- **WHEN** a developer commits source files that contain `<Trans>` or `t` macro calls
- **THEN** the pre-commit hook SHALL run `lingui extract --clean` to update PO catalogs
- **AND** the updated catalogs SHALL be automatically staged via `git add src/locales/`

#### Scenario: Missing translations fail at build/dev time

- **WHEN** a locale catalog has empty `msgstr` entries
- **THEN** `@lingui/vite-plugin` configured with `failOnMissing: true` SHALL fail the build or dev server
- **AND** `failOnCompileError: true` SHALL prevent catalog compilation errors from being silently ignored

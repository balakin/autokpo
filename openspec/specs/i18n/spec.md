## Purpose

Internationalization infrastructure for the AutoKPO PWA, supporting Serbian Latin (source), English, and Russian locales through Lingui.

## Requirements

### Requirement: Lingui provides internationalization infrastructure

The system SHALL use Lingui (`@lingui/core`, `@lingui/react`, `@lingui/babel-plugin-lingui-macro`, `@lingui/cli`, `@lingui/vite-plugin`) as the i18n framework. All packages SHALL be at major version 6. Catalog format SHALL be PO (Lingui default — no explicit `format` key). Base locale SHALL be `sr-Latn`. Supported locales SHALL be `sr-Latn`, `en`, and `ru`.

#### Scenario: Lingui is configured in lingui.config.ts

- **WHEN** the application is built or developed
- **THEN** `lingui.config.ts` at `apps/app/lingui.config.ts` SHALL define `locales: ['sr-Latn', 'en', 'ru']`, `sourceLocale: 'sr-Latn'`, and two `catalogs` entries:
  - one pointing to `apps/app/src/locales/{locale}` covering `src/` (as before)
  - one pointing to `apps/app/worker/locales/{locale}` covering `worker/` (excluding `worker/locales/`, `worker/**/__tests__/`, `worker/**/*.spec.ts`, `worker/**/*.spec.tsx`, `worker/db/`, `worker/env.d.ts`); the `src/` catalog similarly excludes `src/**/__tests__/`, `src/**/*.spec.ts`, `src/**/*.spec.tsx`
- **AND** `@lingui/vite-plugin` v6 SHALL be configured in `vite.config.ts` for HMR, with `@lingui/babel-plugin-lingui-macro` as a Babel plugin inside `@rolldown/plugin-babel` alongside the React Compiler preset
- **AND** `vitest.worker.config.ts` SHALL include `@rolldown/plugin-babel` with `linguiTransformerBabelPreset` and `@lingui/vite-plugin` so macro transforms run in worker tests

#### Scenario: Package scripts for Lingui are available

- **WHEN** a developer runs `pnpm i18n:extract` from the repository root
- **THEN** `turbo run i18n:extract` SHALL delegate to `@autokpo/app` where `lingui extract --clean` scans source files and updates PO catalogs at both `apps/app/src/locales/{locale}` and `apps/app/worker/locales/{locale}`

Note: There is no `i18n:compile` script. The `@lingui/vite-plugin` compiles catalogs on-the-fly during dev and build, with `failOnMissing: true` and `failOnCompileError: true` enforcing completeness.

---

### Requirement: Translation catalogs are PO files in src/locales/

The system SHALL store translations as PO files at `src/locales/{locale}.po`. Catalogs SHALL be committed to the repository. The base locale (`sr-Latn.po`) SHALL contain all keys with Serbian Latin values. Other locale files SHALL contain the same keys with translated values. Message IDs SHALL use URL-safe Base64 encoding (Lingui v6 format: `+` → `-`, `/` → `_`, `=` padding removed).

#### Scenario: Catalog file structure

- **WHEN** `pnpm i18n:extract` is run
- **THEN** catalog files SHALL be created/updated at `src/locales/sr-Latn.po`, `src/locales/en.po`, and `src/locales/ru.po`
- **AND** each file SHALL follow PO format with `msgid` / `msgstr` pairs and plural form metadata
- **AND** auto-generated `msgid` values SHALL use URL-safe Base64 (no `+`, `/`, or `=` characters)

#### Scenario: Missing translations are detected

- **WHEN** a translation key exists in the base locale but `msgstr` is empty in a target locale
- **THEN** `@lingui/vite-plugin` with `failOnMissing: true` SHALL fail the build or dev server

---

### Requirement: I18nProvider wraps the application at root level

The system SHALL render `LocaleProvider` above the router, outside `AuthProvider` and `SignedInApp`, so that locale is available on the auth page. `LocaleProvider` SHALL NOT depend on the CRDT doc — it reads from `localStorage` only. The `I18nProvider` from `@lingui/react` SHALL remain at the root of the application. `LocaleProvider` SHALL also provide React Aria locale context for descendants by rendering `I18nProvider` from `react-aria-components` with a locale derived from the active app locale using `INTL_LOCALES`. On initial load, `LocaleProvider` SHALL read the `autokpo:locale` key from `localStorage`; if absent or invalid, it SHALL check the `?lang=` query parameter for a valid locale hint; if also absent or invalid, it SHALL fall back to the best-match supported locale from `navigator.language`, then `en` if no match is found.

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

#### Scenario: Invalid query parameter is ignored

- **WHEN** `localStorage` has no stored locale
- **AND** the URL includes a `?lang=` value that is not one of `sr-Latn`, `en`, or `ru`
- **THEN** `LocaleProvider` SHALL fall through to `navigator.language` resolution

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

### Requirement: Locale syncs across open tabs via storage event

The system SHALL add a `storage` event listener in `LocaleProvider` that reacts to changes to the `autokpo:locale` key in `localStorage`. When another tab writes a new locale (either from a direct user action or from `LocaleSynchronizer` propagating a CRDT update), the listening tab SHALL update its locale state and activate the new locale in the i18n runtime.

#### Scenario: Locale change in one tab propagates to other tabs

- **WHEN** the user changes the locale in one browser tab
- **THEN** all other open tabs SHALL immediately activate the new locale
- **AND** all translatable strings SHALL re-render in the new locale without a page reload

#### Scenario: storage event for unrelated key is ignored

- **WHEN** a `storage` event fires for a key other than `autokpo:locale`
- **THEN** `LocaleProvider` SHALL NOT update its state or call `i18n.activate`

---

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

---

### Requirement: Locale preference is persisted and switchable

The system SHALL persist the selected locale to `localStorage` under the key `autokpo:locale`. When the user switches locale, the application SHALL immediately re-render with the new locale's translations without a page reload.

#### Scenario: User switches locale

- **WHEN** the user selects a different locale from the Settings page
- **THEN** all translatable strings in the application SHALL immediately update to the new locale
- **AND** the selected locale SHALL be persisted to `localStorage` under the key `autokpo:locale`

#### Scenario: Locale persists across sessions

- **WHEN** the user closes and reopens the application
- **THEN** the application SHALL render with the locale stored in `localStorage`
- **AND** if no stored locale exists, `en` SHALL be used

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

The pre-commit hook SHALL run `pnpm lint-staged` followed by `turbo run i18n:extract` and then stage both `apps/app/src/locales/` and `apps/app/worker/locales/`. This ensures PO catalogs for both the frontend and worker are automatically updated and staged whenever source files containing Lingui macros are committed.

#### Scenario: Both catalogs are updated on commit

- **WHEN** a developer commits source files that contain `<Trans>`, `t`, or `msg` macro calls
- **THEN** the pre-commit hook SHALL run `lingui extract --clean` via `turbo run i18n:extract`
- **AND** the updated catalogs SHALL be automatically staged via `git add apps/app/src/locales/ apps/app/worker/locales/`

#### Scenario: Missing translations fail at build/dev time

- **WHEN** any locale catalog (src or worker) has empty `msgstr` entries
- **THEN** `@lingui/vite-plugin` configured with `failOnMissing: true` SHALL fail the build or dev server

## Why

All UI text (labels, messages, validation errors, aria-labels) is hardcoded in Serbian (Latin). The Settings page already has a non-functional "Jezik" (Language) section placeholder. Adding internationalization enables support for English and Russian alongside Serbian, makes the app accessible to a wider audience, and establishes a sustainable workflow for translation maintenance via AI-assisted translation of JSON catalogs with CI enforcement of completeness.

## What Changes

- Integrate Lingui (`@lingui/core`, `@lingui/react`, `@lingui/babel-plugin-lingui-macro`, `@lingui/vite-plugin`, `@lingui/cli`) as the i18n framework
- Use PO catalog format (Lingui default) for translator-friendly workflow and full plural form metadata
- Add `eslint-plugin-lingui` with `flat/recommended` config, `consistent-plural-format: 'warn'`, and `no-plural-inside-trans: 'warn'` rules (the `no-unlocalized-strings` rule is intentionally excluded due to excessive false positives with HeroUI and Tailwind)
- Add pre-commit hook that runs `lingui extract --clean` and auto-stages updated catalogs
- Extract ~120 hardcoded Serbian strings from UI components into translation catalogs
- Wrap Zod validation schemas in factory functions using `t` from `@lingui/core/macro`, enabling locale-aware error messages
- Create locale catalogs for `sr-Latn` (base), `en`, and `ru`
- Wire locale switching into the existing Settings "Jezik" section
- Persist language preference to `localStorage`
- Add Vite plugin for macro compilation + HMR during development
- Add `i18n:extract` script to `package.json`; no `i18n:compile` script needed — `@lingui/vite-plugin` compiles on-the-fly with `failOnMissing: true` and `failOnCompileError: true`

- The PDF module (`src/pdf/`) internals and `formatters.ts` are explicitly **excluded** — Cyrillic Serbian in PDFs is a legal requirement, and formatters use Serbian locale conventions that should remain fixed regardless of UI language. The PDF download button label in `src/pdf/download-pdf-button.tsx` IS internationalized since it is user-facing UI.

## Capabilities

### New Capabilities

- `i18n`: Lingui internationalization — locale provider, catalog management, macro-based extraction, JSON translation files, locale switching, and CI enforcement of translation completeness.

### Modified Capabilities

- `settings`: Language switching UI replaces the current non-functional "Jezik" placeholder with a working Select component that switches locales and persists the choice.
- `app-shell`: Sidebar and TopBar navigation labels become translatable via Lingui macros.

## Impact

- **Dependencies**: New packages — `@lingui/core`, `@lingui/react`, `@lingui/babel-plugin-lingui-macro`, `@lingui/cli`, `@lingui/vite-plugin`, `eslint-plugin-lingui`
- **Build pipeline**: New `i18n:extract` script (no `i18n:compile` — the Vite plugin compiles on-the-fly); `@lingui/vite-plugin` and `@lingui/babel-plugin-lingui-macro` added to Vite config; `eslint-plugin-lingui` added to ESLint config
- **CI/lint**: `@lingui/vite-plugin` with `failOnMissing: true` and `failOnCompileError: true` enforces translation completeness at build/dev time; `eslint-plugin-lingui` recommended config + `consistent-plural-format` and `no-plural-inside-trans` warnings enforce i18n best practices
- **All UI components**: Every hardcoded string in `src/` (except `pdf/` and `formatters.ts`) must be wrapped with `<Trans>` or `t` macro
- **Zod schemas**: 5 schema files (`entry-form`, `entries-schema`, `entity-profile-schema`, `signature-schema`, `add-book-modal`) converted to factory functions
- **Provider tree**: `I18nProvider` wraps the app at root level

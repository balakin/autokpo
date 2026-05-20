## MODIFIED Requirements

### Requirement: Lingui provides internationalization infrastructure

The system SHALL use Lingui (`@lingui/core`, `@lingui/react`, `@lingui/babel-plugin-lingui-macro`, `@lingui/cli`, `@lingui/vite-plugin`) as the i18n framework. All packages SHALL be at major version 6. Catalog format SHALL be PO (Lingui default — no explicit `format` key). Base locale SHALL be `sr-Latn`. Supported locales SHALL be `sr-Latn`, `en`, and `ru`.

#### Scenario: Lingui is configured in lingui.config.ts

- **WHEN** the application is built or developed
- **THEN** `lingui.config.ts` at `apps/app/lingui.config.ts` SHALL define `locales: ['sr-Latn', 'en', 'ru']`, `sourceLocale: 'sr-Latn'`, and `catalogs` pointing to `src/locales/{locale}` (relative to the app package root)
- **AND** `@lingui/vite-plugin` v6 SHALL be configured in `vite.config.ts` for HMR, with `@lingui/babel-plugin-lingui-macro` as a Babel plugin (not preset) inside `@rolldown/plugin-babel` alongside the React Compiler preset
- **AND** all `@lingui/vite-plugin` v6 peer dependencies (`@babel/core`, `@lingui/babel-plugin-lingui-macro`, `@rolldown/plugin-babel`, `rolldown`) SHALL be satisfied as explicit devDependencies in `apps/app/package.json`

#### Scenario: Package scripts for Lingui are available

- **WHEN** a developer runs `pnpm i18n:extract` from the repository root
- **THEN** `turbo run i18n:extract` SHALL delegate to `@autokpo/app` where `lingui extract --clean` scans source files and updates PO catalogs

Note: There is no `i18n:compile` script. The `@lingui/vite-plugin` compiles catalogs on-the-fly during dev and build, with `failOnMissing: true` and `failOnCompileError: true` enforcing completeness.

---

### Requirement: Pre-commit hook keeps catalogs in sync

The pre-commit hook SHALL run `pnpm lint-staged` followed by `turbo run i18n:extract` and then `git add apps/app/src/locales/`. This ensures PO catalogs are automatically updated and staged whenever source files containing Lingui macros are committed. The Vite plugin's `failOnMissing` and `failOnCompileError` options enforce translation completeness at build/dev time.

#### Scenario: Catalogs are updated on commit

- **WHEN** a developer commits source files that contain `<Trans>` or `t` macro calls
- **THEN** the pre-commit hook SHALL run `lingui extract --clean` via `turbo run i18n:extract` to update PO catalogs
- **AND** the updated catalogs SHALL be automatically staged via `git add apps/app/src/locales/`

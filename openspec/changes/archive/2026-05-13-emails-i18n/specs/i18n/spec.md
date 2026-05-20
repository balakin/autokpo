## MODIFIED Requirements

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

### Requirement: Pre-commit hook keeps catalogs in sync

The pre-commit hook SHALL run `pnpm lint-staged` followed by `turbo run i18n:extract` and then stage both `apps/app/src/locales/` and `apps/app/worker/locales/`. This ensures PO catalogs for both the frontend and worker are automatically updated and staged whenever source files containing Lingui macros are committed.

#### Scenario: Both catalogs are updated on commit

- **WHEN** a developer commits source files that contain `<Trans>`, `t`, or `msg` macro calls
- **THEN** the pre-commit hook SHALL run `lingui extract --clean` via `turbo run i18n:extract`
- **AND** the updated catalogs SHALL be automatically staged via `git add apps/app/src/locales/ apps/app/worker/locales/`

#### Scenario: Missing translations fail at build/dev time

- **WHEN** any locale catalog (src or worker) has empty `msgstr` entries
- **THEN** `@lingui/vite-plugin` configured with `failOnMissing: true` SHALL fail the build or dev server

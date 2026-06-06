## ADDED Requirements

### Requirement: Each app has an independent Turbo lint task

The monorepo SHALL have a `lint` task registered in `turbo.json` with `dependsOn: ["^lint"]`, and each app (`@autokpo/app`, `@autokpo/website`) SHALL have a `lint` script in its `package.json` that runs ESLint against its own source files.

#### Scenario: Lint runs independently per app

- **WHEN** `pnpm turbo lint --filter=@autokpo/website` is run
- **THEN** only `@autokpo/website` is linted and the command exits with code 0 when there are no violations

#### Scenario: App lint cache is not invalidated by unrelated app changes

- **WHEN** a file in `apps/website` is modified and `pnpm turbo lint` is run after a clean cached run of both apps
- **THEN** only `@autokpo/website` lint task is re-executed; `@autokpo/app` lint task is served from cache

#### Scenario: Shared config change invalidates all consumers

- **WHEN** `packages/eslint-config/base.ts` is modified and `pnpm turbo lint` is run
- **THEN** both `@autokpo/app` and `@autokpo/website` lint tasks are re-executed (cache busted)

### Requirement: Shared ESLint base config is published as a workspace package

The monorepo SHALL contain a `packages/eslint-config` workspace package (`@autokpo/eslint-config`) that exports a `base` flat config array containing all rules shared across all apps.

#### Scenario: Base config is importable from app ESLint configs

- **WHEN** `apps/app/eslint.config.ts` imports from `@autokpo/eslint-config/base`
- **THEN** the import resolves to `packages/eslint-config/base.ts` via the pnpm workspace link

### Requirement: Pre-commit hook runs Prettier only

The `lint-staged` configuration SHALL run only Prettier (no ESLint) on staged files. ESLint violations are caught by `turbo lint` in CI.

#### Scenario: Pre-commit does not run ESLint

- **WHEN** a developer commits files with an ESLint violation but no Prettier formatting issues
- **THEN** the pre-commit hook exits with code 0 (ESLint is not invoked by lint-staged)

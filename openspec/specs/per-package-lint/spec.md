## Purpose

Ensure monorepo linting runs through package-scoped Turbo tasks so app lint work is cacheable, affected-package aware, and backed by shared ESLint configuration.

## Requirements

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

The monorepo SHALL contain a `packages/eslint-config` workspace package (`@autokpo/eslint-config`) that exports a `base` flat config array containing all rules shared across all apps and named helper exports needed by package-specific ESLint configs.

#### Scenario: Base config is importable from app ESLint configs

- **WHEN** `apps/app/eslint.config.ts` imports from `@autokpo/eslint-config/base`
- **THEN** the import resolves to `packages/eslint-config/base.ts` via the pnpm workspace link

### Requirement: Pre-push hook runs affected ESLint fix, build, and test tasks

The `.husky/pre-push` hook SHALL run `pnpm turbo lint:fix build test --affected --concurrency=1`. The root `lint-staged` configuration SHALL run only Prettier on staged files.

#### Scenario: Pre-push auto-fixes ESLint violations in affected packages

- **WHEN** a developer pushes changes with auto-fixable ESLint violations in affected packages
- **THEN** `pnpm turbo lint:fix build test --affected --concurrency=1` runs before the push and fixes the violations before continuing to build and test checks

#### Scenario: Pre-push fails on unfixable ESLint violations or failed checks

- **WHEN** a developer pushes changes with ESLint violations that cannot be auto-fixed, failing tests, or build errors in affected packages
- **THEN** the pre-push command exits with a non-zero code and the push is aborted

#### Scenario: lint-staged runs Prettier on staged files

- **WHEN** staged files have Prettier formatting issues
- **THEN** `pnpm lint-staged` rewrites and re-stages those files with correct formatting

### Requirement: CI runs affected Turbo tasks

The CI workflow SHALL check out enough git history for Turbo affected detection and SHALL run affected Turbo tasks for lint, test, and build.

#### Scenario: CI lints only affected packages

- **WHEN** the CI lint step runs for a change
- **THEN** it invokes `pnpm turbo lint --affected` and succeeds when affected packages have no lint violations

#### Scenario: CI tests and builds only affected packages

- **WHEN** the CI test and build steps run for a change
- **THEN** they invoke `pnpm turbo test --affected` and `pnpm turbo build --affected` respectively

### Requirement: Root package.json provides format scripts

The root `package.json` SHALL expose `format` (Prettier check across the whole repo) and `format:fix` (Prettier write across the whole repo) scripts.

#### Scenario: format check fails on unformatted files

- **WHEN** `pnpm format` is run and any file in the repo does not match Prettier's output
- **THEN** the command exits with a non-zero code listing the unformatted files

#### Scenario: format:fix rewrites unformatted files

- **WHEN** `pnpm format:fix` is run
- **THEN** all files in the repo are rewritten to match Prettier's output and the command exits with code 0

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

### Requirement: Pre-commit hook runs ESLint fix then Prettier

The `.husky/pre-commit` hook SHALL run `pnpm lint:fix` (turbo-based ESLint auto-fix across all packages) before `pnpm lint-staged`. The `lint-staged` configuration SHALL run only Prettier on staged files.

#### Scenario: Pre-commit auto-fixes ESLint violations

- **WHEN** a developer commits files with auto-fixable ESLint violations
- **THEN** `pnpm lint:fix` runs before the commit and fixes the violations; the hook exits with code 0

#### Scenario: Pre-commit fails on unfixable ESLint violations

- **WHEN** a developer commits files with ESLint violations that cannot be auto-fixed
- **THEN** `pnpm lint:fix` exits with a non-zero code and the commit is aborted

#### Scenario: lint-staged runs Prettier on staged files

- **WHEN** staged files have Prettier formatting issues
- **THEN** `pnpm lint-staged` rewrites and re-stages those files with correct formatting

### Requirement: Root package.json provides format scripts

The root `package.json` SHALL expose `format` (Prettier check across the whole repo) and `format:fix` (Prettier write across the whole repo) scripts.

#### Scenario: format check fails on unformatted files

- **WHEN** `pnpm format` is run and any file in the repo does not match Prettier's output
- **THEN** the command exits with a non-zero code listing the unformatted files

#### Scenario: format:fix rewrites unformatted files

- **WHEN** `pnpm format:fix` is run
- **THEN** all files in the repo are rewritten to match Prettier's output and the command exits with code 0

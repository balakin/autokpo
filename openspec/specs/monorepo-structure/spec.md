## ADDED Requirements

### Requirement: Turborepo task pipeline orchestrates workspace packages

The system SHALL use Turborepo as the monorepo task runner. A `turbo.json` file at the repository root SHALL define tasks for `build`, `dev`, `test`, `lint`, `lint:fix`, `i18n:extract`, `generate:worker-types`, `check:worker-types`, `db:generate`, `db:migrate:local`, and `db:migrate:remote`. The `build` task SHALL declare `dependsOn: ["^build"]` with `outputs: ["dist/**"]`. The `dev` task SHALL be `persistent: true` with `cache: false`. The `test` task SHALL depend on `build`. Cache-sensitive tasks (`i18n:extract`, `generate:worker-types`, `check:worker-types`, `db:generate`, `db:migrate:local`, `db:migrate:remote`, `lint:fix`) SHALL set `cache: false`.

#### Scenario: turbo run build executes app build

- **WHEN** a developer runs `pnpm build` from the repository root
- **THEN** Turborepo SHALL resolve the `build` task across all workspace packages and execute `tsc -b && vite build` in `@autokpo/app`

#### Scenario: turbo run dev starts persistent dev server

- **WHEN** a developer runs `pnpm dev` from the repository root
- **THEN** Turborepo SHALL start the Vite dev server as a persistent task

#### Scenario: turbo run test depends on build

- **WHEN** a developer runs `pnpm test` from the repository root
- **THEN** Turborepo SHALL run the `build` task first, then execute the `test` task in `@autokpo/app`

---

### Requirement: pnpm workspace declares apps only

The `pnpm-workspace.yaml` at the repository root SHALL declare `packages: ["apps/*"]`. The `packages/` directory SHALL NOT exist in the repository. The root `package.json` SHALL NOT list these directories in a `workspaces` field (pnpm uses `pnpm-workspace.yaml` exclusively).

#### Scenario: pnpm install links workspace packages

- **WHEN** a developer runs `pnpm install` from the repository root
- **THEN** pnpm SHALL install dependencies for all workspace packages under `apps/` and create symlinks between them

#### Scenario: New app can be added to apps/

- **WHEN** a developer creates a new directory under `apps/` with a valid `package.json`
- **THEN** pnpm SHALL recognize it as a workspace package on the next `pnpm install`

#### Scenario: No packages/ directory exists

- **WHEN** the repository root is inspected
- **THEN** there SHALL be no `packages/` directory present

---

### Requirement: Existing app moves to apps/app/ as @autokpo/app

The entire existing application (React PWA + Cloudflare Worker) SHALL be relocated to `apps/app/` as a workspace package named `@autokpo/app`. All internal imports remain unchanged. Config files that are app-specific (`vite.config.ts`, `vitest.*.config.ts`, `wrangler.jsonc`, `drizzle.config.ts`, `lingui.config.ts`, `tsconfig.json` + project references, `index.html`) SHALL move with the app. The `scripts/` directory SHALL move to `apps/app/scripts/`.

#### Scenario: App package has its own package.json

- **WHEN** the monorepo structure is in place
- **THEN** `apps/app/package.json` SHALL have `"name": "@autokpo/app"`, `"private": true`, and all app-specific dependencies and scripts

#### Scenario: App scripts are invocable from root via turbo

- **WHEN** a developer runs `pnpm build` from the repository root
- **THEN** Turborepo SHALL delegate to `@autokpo/app`'s `build` script

#### Scenario: App scripts are invocable directly via filter

- **WHEN** a developer runs `pnpm --filter @autokpo/app <script>` from the repository root
- **THEN** pnpm SHALL execute the script only in the `@autokpo/app` package

---

### Requirement: Root package.json is a minimal orchestrator

The root `package.json` SHALL have `"name": "autokpo"`, `"private": true`, `"packageManager": "pnpm@10.33.2"`. Scripts SHALL delegate to Turborepo: `"build": "turbo run build"`, `"dev": "turbo run dev"`, `"test": "turbo run test"`, `"lint": "turbo run lint"`, `"lint:fix": "turbo run lint:fix"`. The root SHALL only contain devDependencies needed for root-level tooling: `turbo`, `eslint` + plugins, `prettier` + `eslint-config-prettier`, `@commitlint/*`, `husky`, `lint-staged`, `typescript`, `typescript-eslint`, `jiti`.

#### Scenario: Root has no app dependencies

- **WHEN** the root `package.json` is inspected
- **THEN** it SHALL NOT contain runtime dependencies like `react`, `vite`, `hono`, or any `@autokpo/*` workspace references

#### Scenario: Root scripts delegate to turbo

- **WHEN** a developer runs any root-level script (`build`, `dev`, `test`, `lint`)
- **THEN** the script SHALL invoke `turbo run <task>` which routes to the appropriate workspace package

---

### Requirement: Root tsconfig.json covers only root config files

A new `tsconfig.json` at the repository root SHALL type-check only root-level configuration files (`eslint.config.ts`, `commitlint.config.ts`). It SHALL NOT use project references. Its `include` SHALL list only those files. The `compilerOptions` SHALL have `target: "ES2023"`, `module: "ESNext"`, `moduleResolution: "bundler"`, `noEmit: true`, and strict mode enabled.

#### Scenario: Root tsc type-checks config files

- **WHEN** a developer opens `eslint.config.ts` or `commitlint.config.ts` in an editor
- **THEN** TypeScript SHALL provide type checking and IntelliSense for those files

#### Scenario: Root tsconfig does not reference app code

- **WHEN** the root `tsconfig.json` is inspected
- **THEN** it SHALL NOT list `apps/app/tsconfig.json` or any app source directories in project references or include paths

---

### Requirement: Husky hooks use turbo run for app-specific tasks

The `.husky/pre-commit` hook SHALL use `turbo run` for app-specific tasks. The git add path for locale catalogs SHALL reference the app workspace path.

#### Scenario: Pre-commit hook invokes turbo tasks

- **WHEN** a developer commits changes
- **THEN** the pre-commit hook SHALL run `pnpm lint-staged`, `turbo run i18n:extract`, `git add apps/app/src/locales/`, and `turbo run check:worker-types` in sequence

#### Scenario: Pre-push hook remains unchanged

- **WHEN** a developer pushes changes
- **THEN** the pre-push hook SHALL run `pnpm build && pnpm test` (which delegate through root scripts to turbo)

---

### Requirement: Git ignore includes .turbo directory

The `.gitignore` file at the repository root SHALL include `.turbo/` to exclude Turborepo's local cache directory.

#### Scenario: Turborepo cache is not committed

- **WHEN** Turborepo runs and writes cache artifacts
- **THEN** the `.turbo/` directory SHALL be excluded from version control

---

### Requirement: ESLint config references app workspace paths

The root `eslint.config.ts` SHALL reference `apps/app/src/**/*.{ts,tsx}` (and equivalent paths) instead of `src/**/*.{ts,tsx}` for app-specific file patterns. Worker test patterns SHALL reference `apps/app/worker/**/*.spec.ts` and `apps/app/tests/**/*.{ts,tsx}`.

#### Scenario: Linting covers app source files

- **WHEN** a developer runs `pnpm lint` from the repository root
- **THEN** ESLint SHALL process files under `apps/app/src/`, `apps/app/worker/`, and `apps/app/tests/` with the appropriate rule configurations

#### Scenario: Yjs import restriction applies in app workspace paths

- **WHEN** ESLint processes files outside `apps/app/src/crdt/`
- **THEN** the `no-restricted-imports` rule SHALL flag direct `yjs` and `y-*` imports with the message "Import from the crdt module instead of yjs directly."

---

### Requirement: GitHub Actions CI pipeline works with monorepo

The GitHub Actions CI workflow SHALL work with the monorepo structure. The existing `ci-cd.yml` steps (`pnpm check:worker-types`, `pnpm lint`, `pnpm test`, `pnpm build`) SHALL continue to work via root-level scripts that delegate to Turborepo. The setup action SHALL install dependencies for all workspace packages. Turborepo's local cache (`.turbo/`) SHALL be cached between CI runs.

#### Scenario: CI installs all workspace packages

- **WHEN** the CI setup action runs `pnpm install --frozen-lockfile`
- **THEN** dependencies for all workspace packages (`apps/*`) SHALL be installed and linked

#### Scenario: CI commands delegate through turbo

- **WHEN** the CI workflow runs `pnpm build`, `pnpm test`, `pnpm lint`, or `pnpm check:worker-types`
- **THEN** each command SHALL delegate via `turbo run` to the appropriate workspace package task

#### Scenario: Turbo cache is persisted between CI runs

- **WHEN** a CI run completes
- **THEN** the `.turbo/cache` directory SHALL be cached using `hashFiles('pnpm-lock.yaml', 'turbo.json')` as the cache key so subsequent runs benefit from Turborepo's remote-like caching

## Why

The project is a single-package repo that needs to grow into a multi-project workspace. New projects (website, email templates, shared packages) need a home alongside the existing app. Converting to a Turborepo + pnpm workspace monorepo now establishes the infrastructure before adding projects, avoiding painful restructuring later.

## What Changes

- Restructure the repository from a flat single-package layout into an `apps/` + `packages/` monorepo using Turborepo and pnpm workspaces
- Move the entire existing app into `apps/app/` as package `@autokpo/app` with no internal changes
- Create a minimal root `package.json` that orchestrates tasks via `turbo run`
- Create a new root `tsconfig.json` scoped only to root-level config files (`eslint.config.ts`, `commitlint.config.ts`)
- Move app-specific config files (`lingui.config.ts`, `drizzle.config.ts`, `tsconfig.*.json`, `vitest.*.config.ts`, etc.) into `apps/app/`
- Update `pnpm-workspace.yaml` to declare `apps/*` and `packages/*`
- Update ESLint config globs to reference `apps/app/src/**` paths
- Update Husky hooks to use `turbo run` for app-specific tasks and adjust `git add` paths
- Add `.turbo/` to `.gitignore`
- Create empty `packages/` directory for future shared code

## Capabilities

### New Capabilities

- `monorepo-structure`: Turborepo + pnpm workspace configuration, turbo.json task pipeline, root-level tooling (ESLint, Prettier, commitlint, Husky) that orchestrates across workspace packages

### Modified Capabilities

- `i18n`: Lingui config file moves from root to `apps/app/`, path references update accordingly
- `cloudflare-worker`: Wrangler and drizzle config paths remain relative inside `apps/app/`, `check:worker-types` and `db:*` scripts move to app package.json

## Impact

- **BREAKING**: All import paths within the app are unchanged (files move as a unit), but scripts invocable from root change semantics (`pnpm build` → runs via turbo)
- **Git history**: `git mv` preserves history for moved files but diff tooling becomes more verbose
- **CI/CD**: GitHub Actions workflows must `pnpm install` from root; `turbo run build/test/lint` replaces direct scripts
- **Developer workflow**: `pnpm dev` works the same from root (turbo delegates); running app-specific scripts requires `pnpm --filter @autokpo/app <script>`
- **Dependencies**: Root `package.json` keeps only root-level devDeps (turbo, eslint, prettier, commitlint, husky, lint-staged, typescript, typescript-eslint, jiti); all app deps move to `apps/app/package.json`

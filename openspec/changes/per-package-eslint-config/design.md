## Context

The monorepo has one `eslint.config.ts` at the repo root covering both `@autokpo/app` (React + Cloudflare Worker) and `@autokpo/website` (Astro). Lint runs via a root `pnpm lint` script that is not a Turbo task, so Turbo has no lint cache at all — every run lints everything. There are no `packages/` in the workspace yet.

The root config uses ESLint v9 flat config with `typescript-eslint`'s `projectService: true` for type-aware linting, `eslint-plugin-import-x` for import ordering, `eslint-plugin-better-tailwindcss` (with absolute paths resolved from the repo root), plus app-specific plugins for React, Astro, Lingui, and testing.

## Goals / Non-Goals

**Goals:**

- Independent Turbo lint cache per app (changing `website` does not invalidate `app` lint cache)
- Single shared package (`@autokpo/eslint-config`) for common base rules
- Per-package `eslint.config.ts` files as the authoritative lint entry point for each app
- ESLint auto-fix runs on pre-commit via `pnpm lint:fix` in the husky hook

**Non-Goals:**

- Adding new lint rules
- Linting config files at the repo root (commitlint.config.ts, etc.)
- Migrating to a different ESLint plugin set

## Decisions

### 1. Shared base contains only universal rules

The `packages/eslint-config/base.ts` exports a flat config array with: `@eslint/js` recommended, `typescript-eslint` `recommendedTypeChecked` (with `projectService: true`), `eslint-plugin-import-x` flat config + all import-x rules, common TypeScript rules (`no-unused-vars`, `consistent-type-imports`, `consistent-type-exports`), `.d.ts` file overrides, and `eslint-config-prettier` last.

Everything app-specific (React, Astro, Lingui, testing-library, better-tailwindcss, Yjs import restriction) stays in each app's local `eslint.config.ts`.

**Alternative considered**: put framework-specific configs (e.g. `react.ts`, `astro.ts`) in the shared package. Rejected — with only two apps and the user's explicit preference, the added abstraction has no current benefit and makes the shared package harder to reason about.

### 2. Root `eslint.config.ts` is deleted entirely

With lint-staged dropping ESLint and `pnpm lint:fix` being a turbo task that runs per-package configs, there is no process that needs a root-level ESLint config.

### 3. `packages/eslint-config` has its own `tsconfig.json`

Extends `../../tsconfig.json` (the repo root's base compiler options: `strict`, `module: ESNext`, `moduleResolution: bundler`, `noEmit: true`) and overrides `include: ["base.ts"]`. This gives TypeScript checking on the config source without duplicating compiler options.

### 4. Turbo `lint` task uses `dependsOn: ["^lint"]`

`^lint` means: a package's lint cache is invalidated when any of its workspace dependencies change. Since `@autokpo/app` and `@autokpo/website` both depend on `@autokpo/eslint-config`, modifying the shared base will correctly bust both apps' lint caches. The eslint-config package itself has no lint script — the `^lint` dependency is a cache-invalidation signal, not a task to run.

### 5. `lint:fix` task has `cache: false`

Unlike `lint`, `lint:fix` modifies files in the working tree. Caching a task that mutates files would mean the mutations are skipped on cache hits, so the task is always run fresh.

### 6. `pnpm lint:fix` runs in the husky hook, not in lint-staged

lint-staged runs per-file and can re-stage fixed files for the current commit. But with no root ESLint config, lint-staged cannot invoke ESLint per-file across packages without complex path-grouping logic. Running `pnpm lint:fix` (turbo) as a husky hook step is simpler: it fixes all files in all packages, and lint-staged then handles Prettier re-staging on staged files. ESLint fixes to staged files are applied to the working tree but may need a manual `git add` to be included in the commit if the fix touched a file that was only partially staged.

### 7. `better-tailwindcss` plugin `cwd` and `entryPoint` resolved locally

Currently resolved with `resolve(root, 'apps/app')` from the repo root. In `apps/app/eslint.config.ts` this becomes `import.meta.dirname` for `cwd` and a relative path from there for `entryPoint`. This is cleaner and removes the cross-package path dependency.

### 8. `eslint.config.ts` added to `tsconfig.node.json` in each app

`projectService: true` in the base config causes typescript-eslint to type-check every file ESLint visits — including the `eslint.config.ts` file itself. Since `eslint.config.ts` is not included in any app tsconfig by default, the project service rejects it. Adding it to `tsconfig.node.json` (alongside `vite.config.ts`, `drizzle.config.ts`, etc.) resolves this.

### 9. `eslint` and `cross-env` added as direct devDeps in `apps/app`

pnpm does not expose executables from transitive dependencies. `eslint` (CLI) and `cross-env` (used in the `lint` script) must be direct devDeps of `apps/app` to be available when the package runs its own scripts. `apps/website` similarly needs `eslint` directly.

## Risks / Trade-offs

- **ESLint auto-fixes in partially-staged files are not auto-staged** → If `pnpm lint:fix` modifies a file that was only partially staged, the fix lands in the working tree but not the index. The developer must `git add` those files before the next commit. This is an accepted trade-off of running turbo lint:fix (whole-package scope) rather than per-file lint-staged ESLint.
- **`projectService: true` CWD sensitivity** → When ESLint runs from within a package directory (`cd apps/app && pnpm lint`), `projectService` finds the nearest `tsconfig.json` automatically. This is the expected behavior and is well-tested in the `typescript-eslint` project service.
- **pnpm `strictPeerDependencies: true`** → Shared ESLint plugins in `packages/eslint-config` are listed as `dependencies` (not `peerDependencies`) to avoid peer resolution errors in consuming apps under strict peer dep mode.

## Migration Plan

1. Add `packages/*` to `pnpm-workspace.yaml`
2. Create `packages/eslint-config/` with `package.json`, `tsconfig.json`, `base.ts` — move shared ESLint deps from root `package.json` here
3. Run `pnpm install` to wire workspace links
4. Create `apps/app/eslint.config.ts` importing base + app-specific rules; add `eslint.config.ts` to `apps/app/tsconfig.node.json`
5. Create `apps/website/eslint.config.ts` importing base + Astro rules; add `eslint.config.ts` to `apps/website/tsconfig.node.json`
6. Delete root `eslint.config.ts`; update root `tsconfig.json` `include`
7. Add `lint` and `lint:fix` scripts to both app `package.json` files; add `@autokpo/eslint-config: workspace:*`, `eslint`, and (for `apps/app`) `cross-env` as devDeps
8. Update `turbo.json` with `lint` task (`dependsOn: ["^lint"]`) and `lint:fix` task (`cache: false`)
9. Update `.husky/pre-commit` — add `pnpm lint:fix` before `pnpm lint-staged`
10. Update root `package.json` — lint-staged to Prettier only; add `format` / `format:fix` scripts; remove now-redundant ESLint devDeps

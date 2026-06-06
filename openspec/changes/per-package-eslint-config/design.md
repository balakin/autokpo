## Context

The monorepo has one `eslint.config.ts` at the repo root covering both `@autokpo/app` (React + Cloudflare Worker) and `@autokpo/website` (Astro). Lint runs via a root `pnpm lint` script that is not a Turbo task, so Turbo has no lint cache at all — every run lints everything. There are no `packages/` in the workspace yet.

The root config uses ESLint v9 flat config with `typescript-eslint`'s `projectService: true` for type-aware linting, `eslint-plugin-import-x` for import ordering, `eslint-plugin-better-tailwindcss` (with absolute paths resolved from the repo root), plus app-specific plugins for React, Astro, Lingui, and testing.

## Goals / Non-Goals

**Goals:**

- Independent Turbo lint cache per app (changing `website` does not invalidate `app` lint cache)
- Single shared package (`@autokpo/eslint-config`) for common base rules
- Per-package `eslint.config.ts` files as the authoritative lint entry point for each app
- Pre-commit hook runs Prettier only; ESLint is a CI/turbo concern

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

With lint-staged dropping ESLint, there is no process that needs a root-level ESLint config. Keeping a thin root config would create a third source of truth and risk divergence.

**Alternative considered**: keep a thin root config that imports from `@autokpo/eslint-config/base` so lint-staged can still run ESLint. Rejected — the user chose to make lint-staged Prettier-only, making this unnecessary.

### 3. `packages/eslint-config` has its own `tsconfig.json`

Extends `../../tsconfig.json` (the repo root's base compiler options: `strict`, `module: ESNext`, `moduleResolution: bundler`, `noEmit: true`) and overrides `include: ["base.ts"]`. This gives TypeScript checking on the config source without duplicating compiler options.

### 4. Turbo `lint` task uses `dependsOn: ["^lint"]`

`^lint` means: a package's lint cache is invalidated when any of its workspace dependencies change. Since `@autokpo/app` and `@autokpo/website` both depend on `@autokpo/eslint-config`, modifying the shared base will correctly bust both apps' lint caches. The eslint-config package itself has no lint script — the `^lint` dependency is a cache-invalidation signal, not a task to run.

### 5. `better-tailwindcss` plugin `cwd` and `entryPoint` resolved locally

Currently resolved with `resolve(root, 'apps/app')` from the repo root. In `apps/app/eslint.config.ts` this becomes `import.meta.dirname` for `cwd` and a relative path from there for `entryPoint`. This is cleaner and removes the cross-package path dependency.

## Risks / Trade-offs

- **ESLint errors no longer caught pre-commit** → Developers rely on CI (`turbo lint`) to catch lint errors. Mitigated by the fact that most editors run ESLint via LSP in real time anyway.
- **`projectService: true` CWD sensitivity** → When ESLint runs from within a package directory (`cd apps/app && pnpm lint`), `projectService` finds the nearest `tsconfig.json` automatically. This is the expected behavior and is well-tested in the `typescript-eslint` project service. If ever running from root with `--config apps/app/eslint.config.ts`, the project service may need `tsconfigRootDir` configured — not a concern for the Turbo-invoked pattern.
- **pnpm `strictPeerDependencies: true`** → The workspace has strict peer deps. Shared ESLint plugins in `packages/eslint-config` must correctly declare peer deps or list them as `dependencies`. Using `dependencies` (not `peerDependencies`) is simpler and avoids peer resolution errors in consuming apps.

## Migration Plan

1. Add `packages/*` to `pnpm-workspace.yaml`
2. Create `packages/eslint-config/` with `package.json`, `tsconfig.json`, `base.ts` — move shared ESLint deps from root `package.json` here
3. Run `pnpm install` to wire workspace links
4. Create `apps/app/eslint.config.ts` importing base + app-specific rules
5. Create `apps/website/eslint.config.ts` importing base + Astro rules
6. Delete root `eslint.config.ts`; update root `tsconfig.json` `include`
7. Add `lint` scripts to both app `package.json` files; add `@autokpo/eslint-config: workspace:*` devDep to each
8. Update `turbo.json` with `lint` task
9. Update root `package.json` lint-staged to Prettier only; remove now-redundant ESLint devDeps from root

Rollback: revert all file changes and `pnpm install`. No database or infra changes involved.

## Why

Changing any file in the `website` app causes Turbo to re-lint the entire monorepo because lint runs via a single root script with no Turbo task, making per-package caching impossible. Moving to per-package `eslint.config.ts` files backed by a shared `packages/eslint-config` package gives Turbo a cacheable `lint` task per app, so `website` and `app` lint independently.

## What Changes

- **New package** `packages/eslint-config` (`@autokpo/eslint-config`) — exports a `base` flat config array with all shared ESLint rules (TypeScript, imports, prettier compat)
- **New** `apps/app/eslint.config.ts` — composes base with React, testing, Tailwind, and Yjs boundary rules
- **New** `apps/website/eslint.config.ts` — composes base with Astro rules
- **Deleted** root `eslint.config.ts` — no longer needed
- **Updated** `turbo.json` — adds `lint` task (cached, `dependsOn: ["^lint"]`) and `lint:fix` task (uncached) for proper cache invalidation
- **Updated** `pnpm-workspace.yaml` — adds `packages/*` to workspace
- **Updated** `.husky/pre-commit` — runs `pnpm lint:fix` (ESLint fix via turbo) before `pnpm lint-staged`
- **Updated** `lint-staged` in root `package.json` — Prettier only on staged files
- **Updated** root `package.json` — shared ESLint plugin deps move to `packages/eslint-config`; app-specific plugins stay in `apps/app`; adds `format` and `format:fix` scripts (root-level Prettier check/write)
- **Updated** root `tsconfig.json` — removes `eslint.config.ts` from `include` (file is deleted)
- **Updated** `apps/app/tsconfig.node.json` and `apps/website/tsconfig.node.json` — add `eslint.config.ts` to `include` so `projectService: true` can type-check the config file

## Capabilities

### New Capabilities

- `per-package-lint`: Each app has an independent `lint` task cached by Turbo; changing one app does not invalidate the other app's lint cache

### Modified Capabilities

- `eslint-tooling`: ESLint configuration structure changes from a single root config to per-package configs; the requirement that `pnpm lint` passes for `apps/app` still holds, but the mechanism changes

## Impact

- `packages/` workspace directory is created for the first time
- All ESLint plugin dependencies are redistributed: shared plugins move to `packages/eslint-config`, app-specific plugins remain in their respective app
- `lint-staged` no longer runs ESLint on pre-commit; ESLint runs via `pnpm lint:fix` (turbo) in the husky hook, auto-fixing before the commit proceeds
- `turbo lint` becomes the canonical way to lint the monorepo; `pnpm lint:fix` is the canonical way to fix
- `pnpm format` / `pnpm format:fix` are the canonical way to check/fix Prettier across the whole repo
- Root `tsconfig.json` `include` shrinks by one entry

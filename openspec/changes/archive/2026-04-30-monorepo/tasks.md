## 1. Workspace and Turborepo Setup

- [x] 1.1 Add `packages: ["apps/*", "packages/*"]` to `pnpm-workspace.yaml`
- [x] 1.2 Create `turbo.json` at root with task pipeline definitions (`build`, `dev`, `test`, `lint`, `lint:fix`, `i18n:extract`, `generate:worker-types`, `check:worker-types`, `db:generate`, `db:migrate:local`, `db:migrate:remote`)
- [x] 1.3 Create empty `packages/` directory with `.gitkeep`
- [x] 1.4 Add `.turbo/` to `.gitignore`

## 2. Move App to apps/app/

- [x] 2.1 Create `apps/app/` directory
- [x] 2.2 `git mv` source directories: `src/`, `worker/`, `tests/`, `public/`, `scripts/` into `apps/app/`
- [x] 2.3 `git mv` app config files: `index.html`, `vite.config.ts`, `vitest.app.config.ts`, `vitest.worker.config.ts`, `vitest.config.ts`, `wrangler.jsonc`, `worker-configuration.d.ts`, `drizzle.config.ts`, `lingui.config.ts` into `apps/app/`
- [x] 2.4 `git mv` all TypeScript project reference configs: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.worker.json`, `tsconfig.worker.tests.json`, `tsconfig.app.tests.json` into `apps/app/`

## 3. Split package.json

- [x] 3.1 Create `apps/app/package.json` with `"name": "@autokpo/app"`, `"private": true`, all app dependencies, devDependencies, and app scripts
- [x] 3.2 Rewrite root `package.json` as orchestrator with root-only devDependencies and `turbo run` delegation scripts
- [x] 3.3 Remove the original app dependencies from root `package.json`

## 4. Root TypeScript Config

- [x] 4.1 Create new root `tsconfig.json` covering only `eslint.config.ts` and `commitlint.config.ts`
- [x] 4.2 Verify `apps/app/tsconfig.json` project references are self-contained and work from the new location

## 5. ESLint Config Update

- [x] 5.1 Update `eslint.config.ts` globs to reference `apps/app/src/**`, `apps/app/worker/**`, `apps/app/tests/**`

## 6. Husky Hooks Update

- [x] 6.1 Update `.husky/pre-commit` to use `turbo run i18n:extract && git add apps/app/src/locales/ && turbo run check:worker-types`
- [x] 6.2 Update `.husky/pre-push` (no changes needed — `pnpm build && pnpm test` already delegate via turbo)

## 7. CI/CD Updates

- [x] 7.1 Update `.github/workflows/ci-cd.yml` to add Turborepo cache step
- [x] 7.2 Verify the setup action works with workspace `pnpm install` (confirmed — no changes needed)

## 8. Install and Verify

- [x] 8.1 Run `pnpm install` to regenerate `pnpm-lock.yaml` with workspace structure
- [x] 8.2 Run `pnpm build` and verify the app builds successfully
- [x] 8.3 Run `pnpm test` and verify all tests pass (468 passed)
- [x] 8.4 Run `pnpm lint` and verify ESLint works with updated globs
- [x] 8.5 Run `pnpm dev` and verify the dev server starts correctly
- [x] 8.6 Run `pnpm generate:worker-types && pnpm check:worker-types` and verify wrangler types work
- [x] 8.7 Run `pnpm i18n:extract` and verify locale catalogs update correctly

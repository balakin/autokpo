## 1. Workspace Setup

- [x] 1.1 Add `packages/*` to `pnpm-workspace.yaml`
- [x] 1.2 Create `packages/eslint-config/package.json` with name `@autokpo/eslint-config`, type module, exports for `./base`, ESLint as a peer/direct dev dependency, and shared ESLint config dependencies
- [x] 1.3 Create `packages/eslint-config/tsconfig.json` extending `../../tsconfig.json` with `include: ["base.ts"]`

## 2. Shared Base Config

- [x] 2.1 Create `packages/eslint-config/base.ts` — extract shared rules from root `eslint.config.ts`: `@eslint/js` recommended, `tseslint.recommendedTypeChecked` with `projectService: true`, `eslint-plugin-import-x` flat config + all import-x rules, common TS rules (`no-unused-vars`, `consistent-type-imports`, `consistent-type-exports`), `.d.ts` overrides, and re-export shared helpers including `eslintConfigPrettier` and `tseslint`
- [x] 2.2 Run `pnpm install` to wire the `@autokpo/eslint-config` workspace link

## 3. Per-Package ESLint Configs

- [x] 3.1 Create `apps/app/eslint.config.ts` importing base from `@autokpo/eslint-config/base` and adding: `globalIgnores` for app-specific files, react-x + react-refresh + lingui (src files), testing-library (test files), worker test relaxations, `better-tailwindcss` with `cwd`/`entryPoint` resolved from `import.meta.dirname`, `no-restricted-imports` for Yjs
- [x] 3.2 Create `apps/website/eslint.config.ts` importing base plus shared helpers from `@autokpo/eslint-config/base`, adding `astro.configs['flat/recommended']`, configuring `.astro` parser options, and keeping `eslintConfigPrettier` last
- [x] 3.3 Add `@autokpo/eslint-config: workspace:*`, `eslint`, and `cross-env` to `apps/app/package.json` devDependencies; add `lint` and `lint:fix` scripts
- [x] 3.4 Add `@autokpo/eslint-config: workspace:*` and `eslint` to `apps/website/package.json` devDependencies; add `lint` and `lint:fix` scripts
- [x] 3.5 Move app-specific ESLint plugin devDeps from root to their respective app `package.json` files (`@eslint-react/eslint-plugin`, `eslint-plugin-react-refresh`, `eslint-plugin-lingui`, `eslint-plugin-testing-library`, `eslint-plugin-better-tailwindcss` → `apps/app`; `eslint-plugin-astro` → `apps/website`)
- [x] 3.6 Add `eslint.config.ts` to `include` in `apps/app/tsconfig.node.json` (required by `projectService: true`)
- [x] 3.7 Add `eslint.config.ts` to `include` in `apps/website/tsconfig.node.json` (required by `projectService: true`)

## 4. Remove Root Config

- [x] 4.1 Delete `eslint.config.ts` from the repo root
- [x] 4.2 Update root `tsconfig.json` `include` array — remove `eslint.config.ts`, keep `commitlint.config.ts`
- [x] 4.3 Remove shared ESLint plugin devDeps from root `package.json` that have moved to `packages/eslint-config`; remove `@eslint-react/eslint-plugin`, `eslint-plugin-*` that moved to apps
- [x] 4.4 Update root `package.json` `lint-staged` config to run only `prettier --write` (remove ESLint entry)
- [x] 4.5 Add `format` and `format:fix` scripts to root `package.json` (`prettier --check .` and `prettier --write .`)

## 5. Turbo Integration

- [x] 5.1 Add `lint` task to `turbo.json` with `dependsOn: ["^lint"]`
- [x] 5.2 Add `lint:fix` task to `turbo.json` with `dependsOn: ["^lint:fix"]` and `cache: false`
- [x] 5.3 Update root `package.json` `lint` script to `turbo run lint` and `lint:fix` to `turbo run lint:fix`

## 6. Hooks and CI

- [x] 6.1 Replace `.husky/pre-push` root build/test wrappers with `pnpm turbo lint:fix build test --affected --concurrency=1`
- [x] 6.2 Update `.github/workflows/ci-cd.yml` checkout to `fetch-depth: 0` and run `pnpm turbo lint --affected`, `pnpm turbo test --affected`, and `pnpm turbo build --affected`

## 7. Verification

- [x] 7.1 Run `pnpm install` and confirm no peer dependency errors
- [x] 7.2 Run `cd apps/app && pnpm -s lint` — confirm exits 0 with no errors/warnings
- [x] 7.3 Run `cd apps/website && pnpm -s lint` — confirm exits 0 with no errors/warnings
- [x] 7.4 Run `pnpm build` from repo root — confirm build still passes
- [x] 7.5 Run `pnpm turbo lint` — confirm both apps lint independently and cache hits work on second run
- [x] 7.6 Confirm affected Turbo commands used by pre-push/CI target only affected packages

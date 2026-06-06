## 1. Workspace Setup

- [ ] 1.1 Add `packages/*` to `pnpm-workspace.yaml`
- [ ] 1.2 Create `packages/eslint-config/package.json` with name `@autokpo/eslint-config`, type module, exports for `./base`, and all shared ESLint plugin dependencies
- [ ] 1.3 Create `packages/eslint-config/tsconfig.json` extending `../../tsconfig.json` with `include: ["base.ts"]`

## 2. Shared Base Config

- [ ] 2.1 Create `packages/eslint-config/base.ts` — extract shared rules from root `eslint.config.ts`: `@eslint/js` recommended, `tseslint.recommendedTypeChecked` with `projectService: true`, `eslint-plugin-import-x` flat config + all import-x rules, common TS rules (`no-unused-vars`, `consistent-type-imports`, `consistent-type-exports`), `.d.ts` overrides, `eslint-config-prettier` last
- [ ] 2.2 Run `pnpm install` to wire the `@autokpo/eslint-config` workspace link

## 3. Per-Package ESLint Configs

- [ ] 3.1 Create `apps/app/eslint.config.ts` importing base from `@autokpo/eslint-config/base` and adding: `globalIgnores` for app-specific files, react-x + react-refresh + lingui (src files), testing-library (test files), worker test relaxations, `better-tailwindcss` with `cwd`/`entryPoint` resolved from `import.meta.dirname`, `no-restricted-imports` for Yjs
- [ ] 3.2 Create `apps/website/eslint.config.ts` importing base from `@autokpo/eslint-config/base` and adding `astro.configs['flat/recommended']`
- [ ] 3.3 Add `@autokpo/eslint-config: workspace:*` to `apps/app/package.json` devDependencies and add `"lint": "eslint ."` script
- [ ] 3.4 Add `@autokpo/eslint-config: workspace:*` to `apps/website/package.json` devDependencies and add `"lint": "eslint ."` script
- [ ] 3.5 Move app-specific ESLint plugin devDeps that are not in `packages/eslint-config` (e.g. `@eslint-react/eslint-plugin`, `eslint-plugin-react-refresh`, `eslint-plugin-lingui`, `eslint-plugin-testing-library`, `eslint-plugin-better-tailwindcss`, `eslint-plugin-astro`) to their respective app `package.json` files

## 4. Remove Root Config

- [ ] 4.1 Delete `eslint.config.ts` from the repo root
- [ ] 4.2 Update root `tsconfig.json` `include` array — remove `eslint.config.ts`, keep `commitlint.config.ts`
- [ ] 4.3 Remove shared ESLint plugin devDeps from root `package.json` that have moved to `packages/eslint-config` (keep `eslint`, `prettier`, `jiti`, and any non-ESLint deps)
- [ ] 4.4 Update root `package.json` `lint-staged` config to run only `prettier --write` (remove ESLint entry)

## 5. Turbo Integration

- [ ] 5.1 Add `lint` task to `turbo.json` with `dependsOn: ["^lint"]` and `outputs: []`

## 6. Verification

- [ ] 6.1 Run `pnpm install` and confirm no peer dependency errors
- [ ] 6.2 Run `cd apps/app && pnpm -s lint` — confirm exits 0 with no errors/warnings
- [ ] 6.3 Run `cd apps/website && pnpm -s lint` — confirm exits 0 with no errors/warnings
- [ ] 6.4 Run `pnpm build` from repo root — confirm build still passes
- [ ] 6.5 Run `pnpm turbo lint` — confirm both apps lint independently and cache hits work on second run

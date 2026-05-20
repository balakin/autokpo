## 1. Dependencies & Configuration

- [x] 1.1 Install dependencies: `hono`, `@cloudflare/vite-plugin`, `@cloudflare/vitest-pool-workers`, `wrangler`
- [x] 1.2 Update `pnpm-workspace.yaml` to allow builds for `esbuild`, `sharp`, and `workerd`
- [x] 1.3 Add `generate:worker-types` and `check:worker-types` scripts to `package.json`

## 2. Wrangler & Worker Configuration

- [x] 2.1 Create `wrangler.jsonc` with worker name, compatibility date, entry point, and assets config (`run_worker_first: ["/api/*"]`, `not_found_handling: "single-page-application"`)
- [x] 2.2 Run `pnpm generate:worker-types` to produce `worker-configuration.d.ts`
- [x] 2.3 Add `worker-configuration.d.ts` to ESLint global ignores and `.prettierignore`

## 3. TypeScript Project References

- [x] 3.1 Create `tsconfig.worker.json` (ES2023, no DOM, include `worker/`, exclude `**/*.spec.ts`)
- [x] 3.2 Create `tsconfig.worker.tests.json` (ES2023, `@cloudflare/vitest-pool-workers` types, include `tests/worker/` and `worker/**/*.spec.ts`, alias `worker/*`, `tests/*`)
- [x] 3.3 Rename `tsconfig.tests.json` → `tsconfig.app.tests.json` (keep `src/*` alias, change `tests/*` → `tests/app/*`, add `worker-configuration.d.ts` to types)
- [x] 3.4 Update `tsconfig.json` references to include all four projects
- [x] 3.5 Delete old `tsconfig.tests.json`

## 4. Vitest Project Split

- [x] 4.1 Move `tests/fixtures/`, `tests/render-helpers.tsx`, `tests/vitest.setup.ts` to `tests/app/`
- [x] 4.2 Create `vitest.app.config.ts` merging Vite config with jsdom env, `tests/app/` setup, and `src` + `tests` aliases
- [x] 4.3 Create `vitest.worker.config.ts` with `@cloudflare/vitest-pool-workers`, Wrangler config, and `worker` + `tests` aliases
- [x] 4.4 Update root `vitest.config.ts` to use `projects: ['./vitest.app.config.ts', './vitest.worker.config.ts']`
- [x] 4.5 Remove test config from `vite.config.ts` (switch to function form `defineConfig(({ mode }) => ...)`)
- [x] 4.6 Conditionally load `cloudflare()` Vite plugin only when `mode !== 'test'`

## 5. Worker Entry Point & Tests

- [x] 5.1 Create `worker/main.ts` with Hono app, `GET /api/` route returning greeting text, and default export
- [x] 5.2 Create `worker/main.spec.ts` testing `GET /api/` returns 200 with greeting and unknown route returns 404
- [x] 5.3 Create `worker/env.d.ts` with `type Env = {}` and `export type { Env }`

## 6. PWA Integration

- [x] 6.1 Add `navigateFallbackDenylist: [/^\/api\//, /^\/__debug/]` to VitePWA config in `vite.config.ts`

## 7. CI & Git Hygiene

- [x] 7.1 Add `.wrangler` and `.dev.vars*` to `.gitignore`
- [x] 7.2 Add `pnpm check:worker-types` step to `.github/workflows/ci-cd.yml` after setup
- [x] 7.3 Add `pnpm check:worker-types` to `.husky/pre-commit` after i18n extraction
- [x] 7.4 Disable `@typescript-eslint/no-empty-object-type` for `.d.ts` files in ESLint config

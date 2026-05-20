## Context

KPO is a client-side SPA that persists data in `localStorage` with no server component. It uses Vite for building, Vitest for testing, and VitePWA for offline support. The project currently has a single Vitest config and a single test directory (`tests/`). TypeScript is organized with project references (`tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.tests.json`).

Adding a Cloudflare Worker introduces a server-side runtime alongside the SPA, requiring separate build, test, and type-check pipelines for the two environments (browser vs. Workers runtime).

## Goals / Non-Goals

**Goals:**

- Co-locate a Hono-based Cloudflare Worker alongside the SPA in the same repository
- Build and deploy the SPA + worker as a single unit via the Cloudflare Vite plugin
- Isolate test environments: app tests in jsdom, worker tests in the Workers runtime
- Maintain type safety for worker bindings via auto-generated `worker-configuration.d.ts`
- Keep the existing SPA behavior unchanged — worker routes are additive

**Non-Goals:**

- Migrating any existing client logic to the worker
- Adding authentication, database, or persistent storage to the worker
- Multi-worker architecture or Durable Objects
- Modifying the existing PWA caching strategies (only adding deny-list entries)

## Decisions

### 1. Hono as the HTTP framework

**Choice**: Hono  
**Alternatives**: itty-router, bare `fetch` handler  
**Rationale**: Hono provides a familiar Express-like API with first-class TypeScript support and Cloudflare Workers adapters. It has a rich middleware ecosystem and is lightweight (~14KB). The `app.request()` method enables straightforward unit testing without a running server.

### 2. `@cloudflare/vite-plugin` for unified build

**Choice**: Cloudflare's official Vite plugin  
**Alternatives**: Separate Wrangler build pipeline, custom esbuild config  
**Rationale**: The plugin integrates the worker into the existing Vite build, producing a single deployable output. This avoids maintaining dual build pipelines and lets the SPA and worker share dev server infrastructure. Conditional loading (`mode === 'test'` → skip plugin) prevents the Workers runtime from interfering with jsdom tests.

### 3. Vitest project mode for test isolation

**Choice**: `projects` config in root `vitest.config.ts` with two sub-configs (`vitest.app.config.ts`, `vitest.worker.config.ts`)  
**Alternatives**: Single config with environment-specific include patterns, separate `pnpm test:app` / `pnpm test:worker` scripts  
**Rationale**: Project mode lets `pnpm test` run both suites in one invocation while keeping environments isolated. The app project uses jsdom + RTL setup; the worker project uses `@cloudflare/vitest-pool-workers` for a real Workers runtime. Test file paths naturally separate into `tests/app/` and `tests/worker/`.

### 4. Dedicated TypeScript project references

**Choice**: Four `tsconfig` references — `tsconfig.app.json`, `tsconfig.app.tests.json`, `tsconfig.worker.json`, `tsconfig.worker.tests.json`  
**Alternatives**: Single `tsconfig.json` with `include`/`exclude` patterns, or a shared worker tsconfig  
**Rationale**: Project references give incremental type-checking and clear separation of type contexts. The worker has no DOM types (only `ES2023` lib), while app tests need DOM + Workers bindings. Keeping them separate ensures each environment type-checks correctly and quickly.

### 5. Path alias conventions

**Choice**: `worker/*` → `./worker/`, `src/*` → `./src/`, `tests/*` → `./tests/app/` (app) or `./tests/worker/` (worker)  
**Rationale**: Follows existing `src` alias convention. The `worker` alias mirrors `src` for worker-side imports. Test `tests` alias points to the project-specific test directory, keeping import paths consistent across both projects.

### 6. Generated types enforced by CI and pre-commit

**Choice**: `pnpm generate:worker-types` + `pnpm check:worker-types`  
**Alternatives**: Git-ignored `worker-configuration.d.ts`, manual type assertions  
**Rationale**: Checked-in generated types provide IDE autocompletion for Wrangler bindings. The pre-commit hook and CI step ensure they're always in sync, preventing subtle type mismatches that would only surface in production.

## Risks / Trade-offs

- **[Build complexity]** → The Cloudflare Vite plugin adds build-time coupling. If the plugin has bugs or incompatibilities with other Vite plugins (PWA, lingui), debugging may require plugin-source inspection. Mitigated by conditional loading in test mode and keeping the plugin config minimal.
- **[Worker runtime parity]** → Worker tests use `@cloudflare/vitest-pool-workers` which runs in `workerd`, not Node.js. Test utilities that assume Node APIs (fs, path) will not work. Mitigated by isolating worker tests in their own project with appropriate aliases.
- **[Generated file bloat]** → `worker-configuration.d.ts` is ~13K lines from Wrangler auto-generation. Mitigated by adding it to `.eslintignore` and treating it as read-only generated output.
- **[PWA + Worker routing]** → Dual ownership of routes (service worker vs. Cloudflare Worker) can cause confusion if route patterns overlap. Mitigated by the explicit deny-list pattern that keeps `/api/*` out of PWA caching.

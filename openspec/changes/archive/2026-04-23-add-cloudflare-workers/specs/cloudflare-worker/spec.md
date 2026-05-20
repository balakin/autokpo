## ADDED Requirements

### Requirement: Cloudflare Worker entry point

The system SHALL provide a Cloudflare Worker entry point at `worker/main.ts` using the Hono framework that exposes API routes under `/api/*`.

#### Scenario: Health check endpoint responds

- **WHEN** a request is made to `GET /api/`
- **THEN** the worker responds with status 200 and a plain-text greeting

#### Scenario: Unknown API route returns 404

- **WHEN** a request is made to an unregistered `/api/*` path
- **THEN** the worker responds with status 404

### Requirement: Wrangler configuration

The system SHALL include a `wrangler.jsonc` that configures the worker name, compatibility date, entry point, and static assets serving with SPA fallback.

#### Scenario: Worker routes API requests

- **WHEN** a request matches `/api/*`
- **THEN** `run_worker_first` routes it to the worker before serving static assets

#### Scenario: Static SPA fallback for non-API routes

- **WHEN** a request does not match `/api/*`
- **THEN** `not_found_handling: single-page-application` serves the SPA shell

### Requirement: Worker type generation

The system SHALL provide `pnpm generate:worker-types` to regenerate `worker-configuration.d.ts` from `wrangler.jsonc`, and `pnpm check:worker-types` to verify the generated types are up to date.

#### Scenario: Type generation after config change

- **WHEN** a developer modifies `wrangler.jsonc` and runs `pnpm generate:worker-types`
- **THEN** `worker-configuration.d.ts` is regenerated to reflect the current configuration

#### Scenario: CI rejects stale types

- **WHEN** `wrangler.jsonc` has changed but `worker-configuration.d.ts` has not been regenerated
- **THEN** `pnpm check:worker-types` exits with a non-zero code

### Requirement: Separate Vitest projects for app and worker

The system SHALL split Vitest configuration into two projects: `app` (jsdom environment, React Testing Library) and `worker` (Cloudflare Workers pool). The root `vitest.config.ts` SHALL reference both via the `projects` option.

#### Scenario: App tests run in jsdom

- **WHEN** `pnpm test` is executed
- **THEN** app tests (`src/**/*.spec.{ts,tsx}`, `tests/app/**/*.spec.{ts,tsx}`) run in a jsdom environment with React Testing Library setup

#### Scenario: Worker tests run in Workers runtime

- **WHEN** `pnpm test` is executed
- **THEN** worker tests (`worker/**/*.spec.ts`, `tests/worker/**/*.spec.ts`) run using the Cloudflare Vitest pool with the Wrangler config

### Requirement: Separate TypeScript configs for worker and tests

The system SHALL provide dedicated TypeScript project references: `tsconfig.worker.json` for worker source, `tsconfig.worker.tests.json` for worker tests, and `tsconfig.app.tests.json` (renamed from `tsconfig.tests.json`) for app tests. `tsconfig.json` SHALL reference all four projects.

#### Scenario: Worker sources type-check independently

- **WHEN** `tsc -b` is run
- **THEN** `tsconfig.worker.json` type-checks `worker/` with `worker-configuration.d.ts` types, excluding spec files

#### Scenario: Worker test sources type-check independently

- **WHEN** `tsc -b` is run
- **THEN** `tsconfig.worker.tests.json` type-checks `tests/worker/` and `worker/**/*.spec.ts` with `@cloudflare/vitest-pool-workers` types

#### Scenario: App test sources type-check independently

- **WHEN** `tsc -b` is run
- **THEN** `tsconfig.app.tests.json` type-checks `tests/app/` with `src/` and `tests/app/` path aliases

### Requirement: Cloudflare Vite plugin integration

The system SHALL integrate `@cloudflare/vite-plugin` in `vite.config.ts` so the SPA and worker build as a single unit. The plugin SHALL NOT be loaded during tests (`mode === 'test'`).

#### Scenario: Production build includes both SPA and worker

- **WHEN** `pnpm build` is run
- **THEN** the Cloudflare Vite plugin produces a combined output for the SPA and worker

#### Scenario: Plugin is skipped in test mode

- **WHEN** Vite runs in test mode
- **THEN** the Cloudflare Vite plugin is not loaded

### Requirement: PWA excludes worker routes from caching

The system SHALL configure the PWA service worker's `navigateFallbackDenylist` to exclude `/api/*` and `/__debug` from navigation fallback and caching.

#### Scenario: API routes bypass service worker navigation fallback

- **WHEN** the service worker receives a navigation request for `/api/*` or `/__debug`
- **THEN** the request bypasses the cached `index.html` fallback and proceeds to the worker

### Requirement: Pre-commit and CI enforcement

The system SHALL enforce worker type freshness via `pnpm check:worker-types` in both the pre-commit hook and the CI pipeline.

#### Scenario: Pre-commit hook checks types

- **WHEN** a developer commits changes
- **THEN** the pre-commit hook runs `pnpm check:worker-types` after lint and i18n extraction

#### Scenario: CI pipeline checks types

- **WHEN** the CI pipeline runs
- **THEN** it includes a step that runs `pnpm check:worker-types` after setup

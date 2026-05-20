## Why

KPO is currently a purely client-side SPA with no server component. Adding a Cloudflare Worker enables server-side API endpoints (`/api/*`), unlocking the ability to offload work from the client, integrate with external services, and serve dynamic responses — all while keeping the existing SPA architecture intact. Deploying to Cloudflare also provides global edge delivery for the SPA assets and worker logic from a single platform.

## What Changes

- Add a Cloudflare Worker entry point using **Hono** as the HTTP framework (`worker/main.ts`)
- Configure **Wrangler** for local dev, type generation, and deployment (`wrangler.jsonc`)
- Integrate the **Cloudflare Vite plugin** so the worker and SPA build together seamlessly
- Split the Vitest configuration into **two projects** (app, worker) to isolate runtimes and test environments
- Split TypeScript configs into dedicated project references for the app, app tests, worker, and worker tests
- Add worker type generation (`pnpm generate:worker-types`) and a CI/pre-commit check (`pnpm check:worker-types`) to keep generated types in sync with `wrangler.jsonc`
- Update the PWA service worker to skip `/api/*` and `/__debug` routes (handled by the worker, not cached)
- Update `.gitignore`, ESLint config, and AGENTS.md to account for the new worker infrastructure

## Capabilities

### New Capabilities

- `cloudflare-worker`: Cloudflare Worker setup with Hono, Wrangler configuration, Vite plugin integration, dual vitest projects, dedicated TypeScript configs, and type-generation tooling

### Modified Capabilities

- `pwa-offline`: Service worker must exclude `/api/*` and `/__debug` from caching and navigation fallback

## Impact

- **Dependencies**: Add `hono`, `@cloudflare/vite-plugin`, `@cloudflare/vitest-pool-workers`, `wrangler`
- **Build**: Vite config now uses the Cloudflare plugin; SPA and worker build together
- **Testing**: Vitest split into `app` and `worker` projects with separate configs and setup files; existing app tests moved to `tests/app/`
- **TypeScript**: New project references (`tsconfig.worker.json`, `tsconfig.worker.tests.json`, `tsconfig.app.tests.json` replacing `tsconfig.tests.json`)
- **CI/CD**: Added `check:worker-types` step; pre-commit hook runs it alongside lint and i18n extraction
- **PWA**: `navigateFallbackDenylist` excludes worker routes from service worker interception

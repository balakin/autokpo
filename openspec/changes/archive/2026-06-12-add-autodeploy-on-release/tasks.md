## 1. Cloudflare + GitHub setup (operator)

- [x] 1.1 Create a Cloudflare API token scoped to D1 Edit + Workers Scripts Edit for the account hosting `autokpo-app` and `autokpo-website`
- [x] 1.2 Create a GitHub `production` Environment (no required-reviewer rule)
- [x] 1.3 Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as secrets on the `production` Environment
- [x] 1.4 Add client-side build variables as **variables** (`vars`, not secrets) on the `production` Environment: app `VITE_TURNSTILE_SITE_KEY` (required), `VITE_POSTHOG_PROJECT_TOKEN`, `VITE_POSTHOG_HOST`; website `PUBLIC_POSTHOG_PROJECT_TOKEN`, `PUBLIC_POSTHOG_HOST`

## 2. Package scripts

- [x] 2.1 Add `db:migrate:prod` to `apps/app/package.json`: `wrangler d1 migrations apply DB --remote --env production`
- [x] 2.2 Add `deploy` to `apps/app/package.json`: `wrangler deploy --env production`
- [x] 2.3 Add `deploy` to `apps/website/package.json`: `wrangler deploy`
- [x] 2.4 Declare `env: ["VITE_*", "PUBLIC_*"]` on the `build` task in `turbo.json` so strict mode passes client build vars through
- [x] 2.5 Create `apps/website/.env.example` documenting `PUBLIC_POSTHOG_PROJECT_TOKEN` / `PUBLIC_POSTHOG_HOST`

## 3. App deploy workflow

- [x] 3.1 Add `.github/workflows/deploy-app.yml` on `push: tags: ['@autokpo/app@*']`, `environment: production`, `concurrency: { group: deploy-app, cancel-in-progress: false }`, with `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets and `CLOUDFLARE_ENV: production` in job env
- [x] 3.2 Use `./.github/actions/setup` with `cache: false`; build via `pnpm turbo build --filter=@autokpo/app` with `VITE_*` build vars from `vars.*` on the build step; no lint, no test
- [x] 3.3 Apply migrations (`pnpm --filter @autokpo/app exec wrangler d1 migrations apply DB --remote`) before deploy; failure must abort deploy (apply prints the migrations it runs)
- [x] 3.4 Deploy via `pnpm --filter @autokpo/app exec wrangler deploy` (env selected by `CLOUDFLARE_ENV`)

## 4. Website deploy workflow

- [x] 4.1 Add `.github/workflows/deploy-website.yml` on `push: tags: ['@autokpo/website@*']`, `environment: production`, `concurrency: { group: deploy-website, cancel-in-progress: false }`, with the Cloudflare secrets and no `CLOUDFLARE_ENV`
- [x] 4.2 Use `./.github/actions/setup` with `cache: false`; build via `pnpm turbo build --filter=@autokpo/website` with `PUBLIC_*` build vars from `vars.*` on the build step; deploy via `pnpm --filter @autokpo/website exec wrangler deploy` (no migrations)
- [x] 4.3 Confirm each tag pattern triggers only its own workflow (app tag does not deploy website, and vice versa)

## 5. Migration safety guide

- [x] 5.1 Add `apps/app/docs/migrations.md` with the migrate-first invariant, the safe/unsafe classification table, and edge-case recipes (rename, drop, NOT NULL, unique, type narrowing)
- [x] 5.2 Reference the expand/contract rule from `apps/app/CLAUDE.md`

## 6. Docs

- [x] 6.1 Replace the manual deployment steps in `apps/app/README.md` with the automated tag-triggered flow and link to `docs/migrations.md`
- [x] 6.2 Update `apps/website/README.md` (or add a deployment note) describing the automated tag-triggered deploy

## 7. Verification

- [x] 7.1 On the next `@autokpo/app@*` tag, confirm the app workflow runs build → apply migrations → deploy in order without manual approval
- [x] 7.2 Confirm app migrations are applied to `autokpo-database` (production), not `autokpo-database-dev`
- [x] 7.3 On the next `@autokpo/website@*` tag, confirm the website workflow runs build → deploy with no migration step
- [x] 7.4 Confirm the deployed worker (`https://app.autokpo.com`) and website serve the new releases
- [x] 7.5 Confirm the deployed app bundle has a real `VITE_TURNSTILE_SITE_KEY` (Turnstile/captcha renders) and analytics initialize — i.e. the client build vars were present at build time

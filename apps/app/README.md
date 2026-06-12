# @autokpo/app

React PWA + Cloudflare Worker for the AutoKPO application.

## Architecture overview

All app state lives in a single Yjs `Y.Doc` persisted to IndexedDB (`y-indexeddb`). Cross-device sync runs through a Cloudflare Worker backed by Cloudflare D1. The leader tab (determined via Web Locks) is the only one that makes HTTP requests; other tabs communicate via `BroadcastChannel`.

```
src/          — React PWA (Vite)
  crdt/       — Yjs doc, sync engine, leader election, BroadcastChannel bus
  auth/       — authentication screens and hooks
  books/      — KPO book management
  entries/    — KPO entry management
  stats/      — income statistics and charts
  pdf/        — PDF export (@react-pdf/renderer)
  settings/   — app settings
  ui/         — shared UI components (HeroUI v3 + Tailwind v4)
  locales/    — compiled i18n catalogs (sr-Latn, en, ru)

worker/       — Cloudflare Worker (Hono)
  routes/     — API routes (sync, auth, avatars)
  db/         — Drizzle ORM schema and D1 migrations
  locales/    — worker-side i18n catalogs
```

## Prerequisites

- Node 24
- Cloudflare account (for D1 and R2)
- [Resend](https://resend.com) account (transactional email)
- [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) site (bot protection)
- Google and/or GitHub OAuth app credentials

## Local setup

```bash
# 1. Copy and fill in environment files
cp .env.example .env
cp .dev.vars.example .dev.vars

# 2. Create a local D1 database and apply migrations
pnpm db:migrate:local

# 3. Start the dev server
pnpm dev
```

### Environment variables

**`.env`** — Vite public vars (safe to expose to the browser):

| Variable                  | Description                   |
| ------------------------- | ----------------------------- |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |

**`.dev.vars`** — Wrangler secrets (server-side only, never sent to the browser):

| Variable               | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Long random secret for better-auth session signing |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                             |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                         |
| `GITHUB_CLIENT_ID`     | GitHub OAuth client ID                             |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret                         |
| `RESEND_API_KEY`       | Resend API key for transactional email             |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key                    |

## Commands

```bash
pnpm dev                   # start Vite dev server
pnpm build                 # TypeScript + Vite production build
pnpm test                  # run all Vitest suites
pnpm i18n:extract          # extract translatable strings into .po files
pnpm generate:worker-types # regenerate Wrangler types (run after wrangler.jsonc changes)
pnpm check:worker-types    # verify types are up to date (CI / pre-commit)
pnpm db:generate           # generate a new D1 migration after schema changes
pnpm db:migrate:local      # apply migrations to the local D1 database
pnpm db:migrate:remote     # apply migrations to the dev remote D1 database
pnpm db:migrate:prod       # apply migrations to the production D1 database (--env production)
pnpm deploy                # build output is deployed with wrangler deploy --env production
```

## Deployment

Deployment is automated. Cutting a release with Changesets creates an `@autokpo/app@<version>` git tag, which triggers the **Deploy App** GitHub Actions workflow (`.github/workflows/deploy-app.yml`). The workflow:

1. installs cleanly (no restored cache) and builds the app,
2. applies pending D1 migrations to the **production** database — see [`docs/migrations.md`](docs/migrations.md) for migration safety rules,
3. deploys the worker with `wrangler deploy`.

The workflow sets `CLOUDFLARE_ENV=production` at the job level so every Wrangler command targets the `env.production` config — `autokpo-database` and `app.autokpo.com` — without needing an `--env` flag. You do **not** configure `CLOUDFLARE_ENV` yourself; it lives in `deploy-app.yml` only. The website deploy is a separate workflow that sets no `CLOUDFLARE_ENV` (it has no `production` environment), so the two never interfere.

It runs under the `production` GitHub Environment, which holds the workflow's two secrets — `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` — and the **client-side build variables** (see below). Application _runtime_ secrets (`BETTER_AUTH_SECRET`, OAuth credentials, `RESEND_API_KEY`, etc.) are managed separately in the Cloudflare dashboard or via `wrangler secret put`, not by the workflow.

**Client-side build variables.** The browser bundle inlines `VITE_*` variables at **build time**, so they must be present in CI when the workflow builds — otherwise production ships with an empty Turnstile key (captcha/auth breaks) and no analytics. They are publishable (they end up in the client bundle), so they are stored as GitHub Actions **variables** (`vars`), not secrets, on the `production` environment, and listed in `turbo.json`'s `build.env` so Turbo's strict mode passes them through:

| Variable                     | Required | Purpose                           |
| ---------------------------- | -------- | --------------------------------- |
| `VITE_TURNSTILE_SITE_KEY`    | yes      | Cloudflare Turnstile **site** key |
| `VITE_POSTHOG_PROJECT_TOKEN` | no       | PostHog project token (analytics) |
| `VITE_POSTHOG_HOST`          | no       | PostHog ingestion host            |

See [`.env.example`](.env.example) for local development.

First-time setup (operator):

1. Create a Cloudflare API token (D1 Edit + Workers Scripts Edit) and add `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` as secrets on the `production` GitHub Environment.
2. Add the client-side build variables (`VITE_*` above) as **variables** on the `production` environment.
3. Create the Cloudflare D1 resource and set `database_id` in `wrangler.jsonc`.
4. Set the application runtime secrets in Cloudflare.

For a manual deploy outside CI, the package scripts carry the environment explicitly: `pnpm db:migrate:prod` then `pnpm deploy` (both use `--env production`).

## License

[GNU Affero General Public License v3.0](../../LICENSE) (AGPL-3.0).

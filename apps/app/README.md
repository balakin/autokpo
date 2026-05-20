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
pnpm db:migrate:remote     # apply migrations to the remote D1 database (before deploy)
```

## Deployment

1. Create Cloudflare D1 and R2 resources and update the `database_id` and `bucket_name` values in `wrangler.jsonc`.
2. Set all required secrets in the Cloudflare dashboard or via `wrangler secret put`.
3. Run `pnpm db:migrate:remote` to apply migrations.
4. Run `pnpm build` and deploy with `wrangler deploy`.

## License

[GNU Affero General Public License v3.0](../../LICENSE) (AGPL-3.0).

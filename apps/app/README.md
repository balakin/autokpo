# @autokpo/app

[![Application deployment](https://img.shields.io/github/deployments/balakin/autokpo/Application?label=deployment&logo=cloudflare&logoColor=white&style=flat-square)](https://app.autokpo.com)
![React](https://img.shields.io/badge/React-149eca?logo=react&logoColor=white&style=flat-square)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflareworkers&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white&style=flat-square)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square)](../../LICENSE)

React PWA + Cloudflare Worker for the AutoKPO application.

## Architecture overview

Local-first. All app state lives in a single Yjs `Y.Doc` persisted to IndexedDB, so the app works fully offline. Cross-device sync runs through a Cloudflare Worker (Hono) backed by D1 — the leader tab (elected via Web Locks) is the only one that makes HTTP requests, while other tabs follow over `BroadcastChannel`. Synced updates are end-to-end encrypted: the Worker stores opaque ciphertext and never sees plaintext.

The frontend (`src/`) is a React PWA built with Vite, HeroUI v3 + Tailwind v4, organized as flat feature modules (`books`, `entries`, `stats`, `pdf`, `auth`, `settings`, …) with the CRDT/sync core in `crdt/`. The backend (`worker/`) is the Hono Worker with Drizzle-managed D1 schema and migrations.

Deeper design docs live in [`docs/`](docs/):

- [`docs/sync.md`](docs/sync.md) — encrypted sync protocol and leader election
- [`docs/e2ee.md`](docs/e2ee.md) — end-to-end encryption design
- [`docs/csp.md`](docs/csp.md) — Content Security Policy and security headers
- [`docs/migrations.md`](docs/migrations.md) — D1 migration safety rules

For feature-level requirements and architecture decisions, see `openspec/`.

## Prerequisites

- Node 24
- Cloudflare account (for D1)
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

Deployment is automated. When a Release PR merges to `main`, the **Release** workflow (`.github/workflows/release.yml`) publishes the changesets and then — only if `@autokpo/app` was among the published packages — calls the **Deploy App** workflow (`.github/workflows/deploy-app.yml`) as a reusable workflow (`workflow_call`, `secrets: inherit`). It is **not** triggered by the release tag: tags pushed with `GITHUB_TOKEN` don't fire `push`/`create` events, so the reusable-workflow call is what kicks off the deploy, at the same commit the tag points to. You can also run it manually via `workflow_dispatch`.

The workflow is split into two jobs for least privilege:

1. **Build** — installs cleanly (no restored cache) and builds the app, then uploads the deployable output as an artifact. `@cloudflare/vite-plugin` bundles the worker into `dist/` alongside a generated `wrangler.json` deploy snapshot, so the deploy job never re-bundles. This job holds **no** Cloudflare credentials, since it runs untrusted dependency code.
2. **Deploy** — no checkout; downloads the build artifact and runs the pinned `cloudflare/wrangler-action` (installs only `wrangler`, no `pnpm install`) with two commands: `d1 migrations apply DB --remote` to apply pending D1 migrations to the **production** database (see [`docs/migrations.md`](docs/migrations.md) for migration safety rules), then `wrangler deploy`. It runs in the `Application` GitHub Environment (`https://app.autokpo.com`).

Both jobs set `CLOUDFLARE_ENV=production`, so Wrangler targets the `env.production` config — `autokpo-database` and `app.autokpo.com` — without needing an `--env` flag. `d1 migrations apply` reads it from the source `wrangler.jsonc`; `wrangler deploy` follows the build's prebaked snapshot and ignores it. You do **not** configure `CLOUDFLARE_ENV` yourself; it lives in `deploy-app.yml` only. The website deploy is a separate workflow that sets no `CLOUDFLARE_ENV` (it has no `env.production` section), so the two never interfere.

The deploy job authenticates with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (inherited from the caller via `secrets: inherit`). Application _runtime_ secrets (`BETTER_AUTH_SECRET`, OAuth credentials, `RESEND_API_KEY`, etc.) are managed separately in the Cloudflare dashboard or via `wrangler secret put`, not by the workflow.

**Client-side build variables.** The browser bundle inlines `VITE_*` variables at **build time**, so they must be present in CI when the build job runs — otherwise production ships with an empty Turnstile key (captcha/auth breaks) and no analytics. They are publishable (they end up in the client bundle), so they are read from GitHub Actions **variables** (`vars`), not secrets, and listed in `turbo.json`'s `build.env` so Turbo's strict mode passes them through:

| Variable                     | Required | Purpose                           |
| ---------------------------- | -------- | --------------------------------- |
| `VITE_TURNSTILE_SITE_KEY`    | yes      | Cloudflare Turnstile **site** key |
| `VITE_POSTHOG_PROJECT_TOKEN` | no       | PostHog project token (analytics) |
| `VITE_POSTHOG_HOST`          | no       | PostHog ingestion host            |

See [`.env.example`](.env.example) for local development.

First-time setup (operator):

1. Create a Cloudflare API token (D1 Edit + Workers Scripts Edit) and add `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` as secrets the deploy job can read (repository secrets, or the `Application` GitHub Environment).
2. Add the client-side build variables (`VITE_*` above) as repository **variables** (`vars`) so the build job picks them up.
3. Create the Cloudflare D1 resource and set `database_id` in `wrangler.jsonc`.
4. Set the application runtime secrets in Cloudflare.

For a manual deploy outside CI, the package scripts carry the environment explicitly: `pnpm db:migrate:prod` then `pnpm deploy` (both use `--env production`).

## License

[GNU Affero General Public License v3.0](../../LICENSE) (AGPL-3.0).

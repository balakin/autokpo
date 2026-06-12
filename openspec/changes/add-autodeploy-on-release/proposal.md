## Why

Deployment is manual today (README: `pnpm db:migrate:remote`, then `pnpm build`, then `wrangler deploy`) for both deployable packages — `@autokpo/app` (Cloudflare Worker + D1) and `@autokpo/website` (static Astro site). The error-prone parts are:

- **Ordering (app)** — D1 schema migrations and the worker deploy are two separate, non-atomic operations. By hand this invites a wrong order or a forgotten migration.
- **Target (app)** — the existing `db:migrate:remote` script runs `wrangler d1 migrations apply DB --remote` with **no `--env`**, so it targets `autokpo-database-dev`, **not** production (`autokpo-database`, under `env.production`).
- **Duplication** — both packages share the same deploy skeleton (clean build → `wrangler deploy`) and the same CI credential (`CLOUDFLARE_API_TOKEN`); wiring them separately would duplicate it.

We already cut releases with Changesets, which creates per-package tags — `@autokpo/app@0.3.0`, `@autokpo/website@0.3.0` — only when the reviewed "Version Packages" PR is merged. Those tags are clean, deliberate deploy signals. This change adds a **reusable deploy workflow** invoked by per-package callers on their release tags: the app caller migrates production D1 before deploying; the website caller just builds and deploys. It also documents the **expand/contract migration rules** so app schema changes are safe to apply automatically.

## What Changes

- Add a reusable `.github/workflows/deploy.yml` (`workflow_call`) parameterized by `package`, `wrangler-env`, `run-migrations`, and `environment`. Skeleton: clean cache-free install → build the package → optional migrate → `wrangler deploy`.
- Add `.github/workflows/deploy-app.yml` — on `@autokpo/app@*` tags → calls the reusable workflow with `run-migrations: true`, `wrangler-env: production`.
- Add `.github/workflows/deploy-website.yml` — on `@autokpo/website@*` tags → calls it with `run-migrations: false`, no `--env`.
- App pipeline migrates **before** deploy, against the production DB (`--env production`), and lists pending migrations to the log first.
- Clean cache-free build, no lint/test re-run (code is gated at PR time; the clean build is the cache-poisoning defense). Each tag deploys only its own package; deploys are serialized per package.
- Run under a credential-scoped `production` GitHub Environment (no required-reviewer gate — the release-PR merge is the human checkpoint). Both packages need only `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.
- Add package scripts: app `db:migrate:prod` + `deploy`; website `deploy`.
- Add `apps/app/docs/migrations.md` — migration safety guide (safe/unsafe table + expand/contract recipes); reference the rule from `apps/app/CLAUDE.md`.
- Update both READMEs to describe the automated tag-triggered flow.

## Capabilities

### New Capabilities

- `deploy-pipeline`: A reusable, parameterized GitHub Actions workflow that deploys monorepo packages to Cloudflare on their Changeset release tags. The `@autokpo/app` caller applies D1 migrations to the production database before deploying the worker; the `@autokpo/website` caller builds and deploys the static site. Clean cache-free builds, credential-scoped `production` environment, unattended, serialized per package.
- `migration-safety-guide`: A documented set of rules (`apps/app/docs/migrations.md`) classifying which D1 schema migrations are safe to auto-apply on release and giving expand/contract recipes for the unsafe ones.

## Impact

- `.github/workflows/deploy.yml` — new reusable workflow
- `.github/workflows/deploy-app.yml`, `.github/workflows/deploy-website.yml` — new caller workflows
- `apps/app/package.json` — add `db:migrate:prod` and `deploy` scripts
- `apps/website/package.json` — add `deploy` script
- `apps/app/docs/migrations.md` — new migration safety guide
- `apps/app/CLAUDE.md` — reference the expand/contract rule
- `apps/app/README.md`, `apps/website/README.md` — replace manual deploy steps with the automated flow
- GitHub repo settings — `production` Environment + `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets (operator action, documented in tasks)

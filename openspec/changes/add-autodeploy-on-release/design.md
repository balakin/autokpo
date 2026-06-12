## Context

The monorepo has two deployable packages, both targeting Cloudflare:

- `@autokpo/app` (`apps/app`) — a Cloudflare Worker (`autokpo-app`) plus Vite-built static assets, with a **D1 database**. `wrangler.jsonc` declares two environments: top-level default (`autokpo-database-dev`) and `env.production` (`autokpo-database`, `workers_dev: false`, production vars/secrets). Build: `tsc -b && vite build`. Deploy needs `--env production`.
- `@autokpo/website` (`apps/website`) — a **static Astro site** served as Cloudflare Workers assets (`autokpo-website`). `wrangler.jsonc` has a single environment, **no D1, no secrets, no `env.production`**. Build: `astro check && astro build`. Deploy is plain `wrangler deploy`.

Releases are cut by Changesets (`release.yml`). On merge of the reviewed "Version Packages" PR, `changeset tag` creates per-package tags such as `@autokpo/app@0.3.0` and `@autokpo/website@0.3.0`. These tags are the deploy triggers.

Both packages build with `@cloudflare/vite-plugin` / Astro respectively, so deploy is **build then `wrangler deploy`** — wrangler uploads the build output, it does not build.

The two deploys differ only in: (a) the app runs D1 migrations, the website does not; (b) the app deploys with `--env production`, the website with no `--env`. Everything else — checkout, clean setup, build the package, `wrangler deploy`, auth, concurrency, tag trigger — is identical. For CI both need `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (secrets) plus their **client-side build variables** (app: `VITE_*`; website: `PUBLIC_*`) which Vite/Astro inline into the bundle at build time. The app's _runtime_ secrets are managed separately via `wrangler secret put`, not in the workflow.

## Goals / Non-Goals

**Goals**

- Deploy each package to production automatically when its Changeset release tag is pushed, with no cross-triggering.
- Keep each package's deploy in its own self-contained, readable workflow.
- For the app: apply D1 migrations to the **production** database (`--env production`) strictly before the worker deploy.
- Clean, cache-free build for both (no reuse of `ci-cd.yml` output); no lint/test re-run.
- Run under a credential-scoped `production` GitHub Environment, unattended.
- Document which migrations are safe to auto-apply and how to perform the unsafe ones.

**Non-Goals**

- Preview/staging deploys per PR or per branch.
- Automatic database rollback (covered operationally by D1 Time Travel + `wrangler rollback`).
- Replacing Changesets/`release.yml`.

## Decisions

### Decision: Two standalone workflows (no reusable layer)

**Chosen:** Two self-contained workflows — `deploy-app.yml` (tag `@autokpo/app@*`) and `deploy-website.yml` (tag `@autokpo/website@*`). Each declares its own trigger, `concurrency`, `environment: production`, setup, build (with its own client vars), and deploy. The app additionally lists + applies D1 migrations before deploying.

**Rationale:** A reusable `workflow_call` template was tried first, but with only two targets the parameterization (`run-migrations` conditionals, a `wrangler-env` input feeding `CLOUDFLARE_ENV`, both `VITE_*` and `PUBLIC_*` build vars threaded through one body) cost more clarity than the duplication it removed. Two concrete files read top-to-bottom: the app file plainly migrates-then-deploys against `CLOUDFLARE_ENV: production`; the website file plainly builds-and-deploys with no env. The shared skeleton (checkout, `./.github/actions/setup cache: false`, `turbo build --filter`, `wrangler` via `pnpm --filter … exec`) is a handful of lines duplicated — acceptable for the readability. If a third deployable package appears and the pattern is truly identical, revisit extracting a reusable workflow then.

**Alternative considered:** One reusable workflow + two thin callers. Rejected for two targets — the indirection and conditionals obscured more than they saved.

### Decision: Trigger on per-package release tags, with isolation

**Chosen:** `deploy-app.yml` on `push: tags: ['@autokpo/app@*']`; `deploy-website.yml` on `push: tags: ['@autokpo/website@*']`.

**Rationale:** The tag is the deliberate "ship it" signal and only appears after the reviewed release-PR merge. Per-tag filters guarantee an app release never deploys the website and vice versa, and a release that bumps both packages fires both workflows independently.

### Decision: App migrates-first, targeting production via `CLOUDFLARE_ENV`

**Chosen pipeline (app):** build → `wrangler d1 migrations apply DB --remote` → `wrangler deploy`, with `CLOUDFLARE_ENV=production` in scope on the wrangler steps.

**Rationale:** Worker/DB deploy is never atomic; the safe ordering is migrate-first with only migrations the live (old) worker tolerates (expand/contract — see the guide). The existing `db:migrate:remote` omits the environment and targets `autokpo-database-dev`; production MUST select the `production` environment. The deploy job does so via `CLOUDFLARE_ENV` (see next decision); the standalone `db:migrate:prod` script encodes `--env production` for manual use. The website has no migration step (`run-migrations: false`).

### Decision: Select the Wrangler environment via `CLOUDFLARE_ENV`

**Chosen:** `deploy-app.yml` sets `CLOUDFLARE_ENV: production` at the job level; `deploy-website.yml` sets it nowhere. Wrangler picks it up for every command in the app job (migrate/deploy), so they carry no `--env` flag.

**Rationale:** `CLOUDFLARE_ENV` is Wrangler's documented equivalent of `--env` (confirmed in the 4.98 bundle: `envName = args.env ?? CLOUDFLARE_ENV`, guarded by `if (envName)`). With standalone workflows it is scoped by construction — the app sets it, the website doesn't — so there is no risk of it leaking into the website deploy. This matters because the website has no `env.*` section: a `production` value there produces a "No environment found" warning today and a hard **error** the moment the website gains any `[env.*]` section (Wrangler errors when other env sections exist, warns only when none do). The two workflows being separate removes that risk entirely, with no shared/global variable. For manual runs the package scripts still pass `--env production` explicitly (`db:migrate:prod`, `deploy`).

### Decision: Clean cache-free build, no lint or test re-run

**Chosen:** Both workflows install clean (setup action `cache: false`), restore no Turborepo cache, and run only `build` (the package's own script) before deploy. No lint, no test.

**Rationale:**

- **Build is mandatory** — it produces the artifact `wrangler deploy` uploads, and its success is the compile/bundle check (the website's `astro check` is its typecheck gate). It must run clean: this is a privileged context, and GitHub Actions caches (pnpm store, `.turbo/cache`) can be written by PR-sourced runs and restored here. A clean, no-cache install removes the poisoning vector — the clean **build** is the protection, not tests. Mirrors `release.yml`'s existing `cache: false`.
- **Lint dropped** — cannot affect deployability; already ran on PRs.
- **Test dropped** — Vitest runs against source byte-identical to PR-tested source (the release commit only bumps versions/changelog), and never exercises the production bundle. Re-running re-checks already-checked source and doesn't validate the artifact; it contributes nothing to poisoning protection.

### Decision: Provide client-side build variables in CI, via Turbo-declared env

**Chosen:** The build step exports the client-side build variables from GitHub Actions **variables** (`vars`, not secrets) on the `production` environment — app `VITE_TURNSTILE_SITE_KEY`, `VITE_POSTHOG_PROJECT_TOKEN`, `VITE_POSTHOG_HOST`; website `PUBLIC_POSTHOG_PROJECT_TOKEN`, `PUBLIC_POSTHOG_HOST`. `turbo.json`'s `build` task declares `env: ["VITE_*", "PUBLIC_*"]` so they reach the underlying build.

**Rationale:** Vite (`VITE_*`) and Astro (`PUBLIC_*`) inline these into the browser bundle at **build time**. The deploy does a clean, cache-free build, so if they are absent the production bundle ships with an empty `VITE_TURNSTILE_SITE_KEY` (captcha/auth break) and no analytics. They are publishable (they live in the client bundle), so `vars` is the correct store, not secrets — and it avoids log-masking noise. Turbo 2 runs in strict env mode (no `envMode` set, default `strict`), which filters undeclared env vars out of tasks; the `env: ["VITE_*", "PUBLIC_*"]` wildcard both passes them through and makes the build cache correctly sensitive to their values. Each workflow's build step sets only its own prefix (app `VITE_*`, website `PUBLIC_*`). Runtime (server) secrets are unaffected — they stay in Cloudflare via `wrangler secret put`.

### Decision: GitHub `production` Environment, no required-reviewer gate

**Chosen:** Both deploy jobs declare `environment: production` (holding the shared Cloudflare credentials), with **no required-reviewer rule**. Deploy runs unattended.

**Rationale:** The release flow already has two human checkpoints before a tag exists — reviewed feature PRs and the explicit release-PR merge. A required-reviewer click would re-review a decision just made. The environment is kept for credential scoping (token exposed only to deploy jobs), deployment history, and the option to add reviewers later with no code change. The one thing the release-PR review doesn't surface — "this release applies a schema migration" — is visible in the deploy log anyway: `wrangler d1 migrations apply` prints the migrations it is about to run before applying them, so no separate list step is needed. Both packages share one environment, which holds the Cloudflare credentials and each package's client-side build variables.

### Decision: Serialize deploys per package

**Chosen:** `concurrency: { group: deploy-app | deploy-website, cancel-in-progress: false }` — a distinct group in each workflow.

**Rationale:** Prevents a migration/deploy from interleaving with another run of the _same_ package, while letting app and website deploy independently. Never cancel an in-flight deploy.

## Migration safety model (content for `apps/app/docs/migrations.md`)

The non-negotiable invariant for auto-migrate-on-release:

> At the instant a migration applies, the **currently-live (old) worker** must tolerate the new schema. Because we migrate before deploy, the old code is what runs during the window. Only ship migrations it can survive.

### Safe / unsafe classification

| Migration                                 | Auto-safe on release? | Why                                                             |
| ----------------------------------------- | --------------------- | --------------------------------------------------------------- |
| `CREATE TABLE`, `CREATE INDEX`            | ✅ Yes                | Old worker ignores what it doesn't know                         |
| `ADD COLUMN` (nullable or with `DEFAULT`) | ✅ Yes                | Old worker never selects it; new worker does                    |
| Additive backfill `UPDATE`                | ✅ Usually            | Idempotent, no schema break                                     |
| `DROP INDEX`                              | ✅ Usually            | Safe unless a query depends on it for correctness               |
| `ADD COLUMN NOT NULL` without `DEFAULT`   | ⚠️ Risky              | Fails if rows exist; SQLite restriction                         |
| Add `UNIQUE` over existing data           | ⚠️ Risky              | Aborts mid-apply if duplicates exist                            |
| Narrowing a type / `CHECK` over old data  | ⚠️ Risky              | May abort partway; no clean auto-rollback of a partial batch    |
| `RENAME COLUMN` / `RENAME TABLE`          | ❌ Breaks             | Old worker (live during the window) queries the old name → 500s |
| `DROP COLUMN` / `DROP TABLE`              | ❌ Breaks             | Still-running old code references it                            |

### Edge-case recipes

**Rename a column (`image` → `avatar_url`) — three releases.**

1. **Expand.** Add `avatar_url` (nullable) in the drizzle schema _alongside_ `image` so drizzle generates a pure `ADD COLUMN` (no rename prompt). Hand-add a backfill: `UPDATE user SET avatar_url = image WHERE avatar_url IS NULL;`. Ship worker code that reads `avatar_url ?? image` and **writes both**.
2. **Stop using old.** No migration. Ship code that reads/writes **only** `avatar_url` and references `image` nowhere. Keep `image` in the schema so drizzle doesn't drop it yet.
3. **Contract.** Remove `image` from the schema; drizzle generates `DROP COLUMN image`. Live worker (release 2) no longer touches it. Safe.

Never answer **y** to drizzle-kit's `Is image column renamed to avatar_url?` prompt — that emits the unsafe one-shot `RENAME COLUMN`. Expand/contract sidesteps the prompt (only ever a pure add, then a pure drop).

**Drop a column — two releases.** (1) Ship code that stops referencing the column. (2) After that worker is live, ship the `DROP COLUMN` migration. Confirm the column is not in any index/constraint first, or the drop aborts mid-batch.

**Add a NOT NULL column — expand then tighten.** (1) `ADD COLUMN ...` nullable (or with a `DEFAULT`); backfill; ship code that always writes it. (2) Once all rows are populated and the live worker always writes it, add the `NOT NULL` constraint (table rebuild) in a later migration.

**Add a UNIQUE constraint — clean data first.** (1) Ship a backfill/dedup migration + code that stops creating duplicates. (2) After data is clean, add the unique index. Adding it over dirty data aborts the migration.

**Type narrowing / new CHECK.** Treat like UNIQUE: ensure existing rows already satisfy the constraint (backfill in an earlier release) before applying it.

## Risks / Trade-offs

- **Wrong-database migration.** The strongest concrete risk: forgetting the production environment migrates `autokpo-database-dev`. Mitigated by `CLOUDFLARE_ENV: production` on the app workflow (and `--env production` in the `db:migrate:prod` script for manual use).
- **Partial-apply.** A multi-statement migration can fail midway with no auto-rollback. Mitigated by small migrations, local/CI application before tag, and D1 Time Travel as backstop.
- **No DB rollback on worker rollback.** `wrangler rollback` reverts code, not schema. Expand/contract guarantees backward-compatible migrations so a worker rollback is always safe; only the contract (drop) step is irreversible, and by then nothing references the dropped object.
- **Duplicated skeleton.** The two standalone workflows repeat checkout/setup/build/deploy (~10 lines). Accepted — concrete and readable beats a parameterized template for two targets; extract a reusable workflow only if a third identical package appears.

## Migration Plan (operator + code)

1. Create a Cloudflare API token (D1 edit + Workers Scripts edit) and add `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` to a new GitHub `production` Environment (no required-reviewer rule).
2. Add scripts: app `db:migrate:prod` (`wrangler d1 migrations apply DB --remote --env production`) and `deploy` (`wrangler deploy --env production`); website `deploy` (`wrangler deploy`).
3. Add the two standalone workflows (`.github/workflows/deploy-app.yml`, `deploy-website.yml`).
4. Add `apps/app/docs/migrations.md` from the model above; link the expand/contract rule from `apps/app/CLAUDE.md`.
5. Update both READMEs' deployment sections to describe the automated tag flow.
6. Validate on the next tags: confirm each package deploys only on its own tag, the app applies migrations to `autokpo-database` (production, not the dev DB), and the website deploys with no migration step.

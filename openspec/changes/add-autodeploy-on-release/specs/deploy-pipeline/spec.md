## ADDED Requirements

### Requirement: Standalone deploy workflows

The system SHALL provide two self-contained workflows — `.github/workflows/deploy-app.yml` and `.github/workflows/deploy-website.yml` — with no shared reusable/`workflow_call` template. Each SHALL define its own tag trigger, `concurrency`, `environment: production`, clean setup, build, and `wrangler deploy`, sourcing `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from the `production` environment.

#### Scenario: Each workflow is self-contained

- **WHEN** either deploy workflow runs
- **THEN** it executes its full pipeline within a single workflow file without invoking a shared reusable workflow

### Requirement: App deployed on its release tag with migrations

The system SHALL provide `.github/workflows/deploy-app.yml` triggered on push of tags matching `@autokpo/app@*`. It SHALL run under `environment: production` with `CLOUDFLARE_ENV: production` set at the job level, build the app, and apply D1 migrations to the production database before deploying the worker.

#### Scenario: App tag triggers app deploy with migration

- **WHEN** a tag matching `@autokpo/app@*` is pushed
- **THEN** the app deploy runs and applies D1 migrations before deploying the worker

#### Scenario: Migrations target the production database

- **WHEN** the app migration step runs
- **THEN** it runs `wrangler d1 migrations apply DB --remote` with `CLOUDFLARE_ENV=production` in scope, applying to `autokpo-database` (the `env.production` binding), not `autokpo-database-dev`

#### Scenario: Migration failure aborts app deploy

- **WHEN** the production migration step exits non-zero
- **THEN** the worker deploy step does not run and the workflow fails

#### Scenario: Applied migrations are visible in the log

- **WHEN** the app migration step runs
- **THEN** `wrangler d1 migrations apply` prints the migrations it applies to the run log (no separate list step is required)

### Requirement: Website deployed on its release tag without migrations

The system SHALL provide `.github/workflows/deploy-website.yml` triggered on push of tags matching `@autokpo/website@*`. It SHALL run under `environment: production`, build the static site, and deploy it with `wrangler deploy` — no migration step and no `CLOUDFLARE_ENV` set, so Wrangler uses the website's single (default) config.

#### Scenario: Website tag triggers website deploy

- **WHEN** a tag matching `@autokpo/website@*` is pushed
- **THEN** the website deploy builds the Astro site and runs `wrangler deploy` with no migration step and no `CLOUDFLARE_ENV` (default config; the website has no `env.production`)

### Requirement: Deploy tag isolation

Each workflow SHALL respond only to its own package's tag. An app release tag SHALL NOT deploy the website, and a website release tag SHALL NOT deploy the app.

#### Scenario: App tag does not deploy website

- **WHEN** a tag matching `@autokpo/app@*` is pushed
- **THEN** the website deploy workflow does not run

#### Scenario: Website tag does not deploy app

- **WHEN** a tag matching `@autokpo/website@*` is pushed
- **THEN** the app deploy workflow does not run

### Requirement: Clean cache-free build

Each deploy workflow SHALL install dependencies with no restored cache (setup action with `cache: false`, no Turborepo cache) and build the target package from scratch before deploying. It SHALL NOT reuse build output or caches produced by `ci-cd.yml`, and SHALL NOT re-run lint or test — those gate the code at PR time, and the clean build (not the tests) is what protects against cache poisoning.

#### Scenario: Dependencies install clean

- **WHEN** a deploy runs
- **THEN** it invokes the setup action with `cache: false` and does not restore the pnpm store or `.turbo/cache`

#### Scenario: Build runs before deploy

- **WHEN** a deploy runs
- **THEN** the target package is built (`turbo build --filter=<package>`) from the clean install and must succeed before the migrate (if any) and deploy steps run

#### Scenario: Lint and test are not re-run

- **WHEN** a deploy runs
- **THEN** it does not run lint or the test suite

### Requirement: Client-side build variables available at build time

The build step SHALL provide each package's client-side build variables — exposed as GitHub Actions variables (`vars`) on the `production` environment — to the build, so Vite (`VITE_*`) and Astro (`PUBLIC_*`) inline them into the bundle. `turbo.json`'s `build` task SHALL declare `env: ["VITE_*", "PUBLIC_*"]` so Turbo's strict env mode passes them through. These are publishable values stored as variables, not secrets.

#### Scenario: App build receives its client variables

- **WHEN** the app build runs
- **THEN** `VITE_TURNSTILE_SITE_KEY`, `VITE_POSTHOG_PROJECT_TOKEN`, and `VITE_POSTHOG_HOST` from the `production` environment are present so Vite inlines them into the client bundle

#### Scenario: Website build receives its client variables

- **WHEN** the website build runs
- **THEN** `PUBLIC_POSTHOG_PROJECT_TOKEN` and `PUBLIC_POSTHOG_HOST` from the `production` environment are present so Astro inlines them into the bundle

#### Scenario: Turbo passes the build variables through

- **WHEN** `turbo build` runs in strict env mode
- **THEN** the `build` task's declared `env: ["VITE_*", "PUBLIC_*"]` makes the `VITE_*` / `PUBLIC_*` variables available to the underlying Vite/Astro build

### Requirement: Production environment for credential scoping

Both deploy workflows SHALL run under `environment: production` so the Cloudflare credentials are scoped to deploy jobs and deployments are recorded in GitHub. The environment SHALL NOT impose a required-reviewer approval; deploys run unattended on a release tag, since the deliberate merge of the Changeset release PR already serves as the human checkpoint. Both packages SHALL require only `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

#### Scenario: Deploy runs without manual approval

- **WHEN** a deploy workflow starts for a release tag
- **THEN** it proceeds without waiting for a manual approval

#### Scenario: Credentials are environment-scoped

- **WHEN** a deploy job runs
- **THEN** `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are sourced from the `production` environment rather than being available to unrelated workflows

### Requirement: Serialized deploys per package

Each workflow SHALL use its own concurrency group (`deploy-app`, `deploy-website`) that serializes deploys of the same package and does not cancel an in-progress deploy. The two packages SHALL be able to deploy concurrently.

#### Scenario: Same-package deploys are serialized

- **WHEN** a second release tag for the same package is pushed while its deploy is in progress
- **THEN** the second run waits for the first to finish rather than cancelling it

#### Scenario: Different packages deploy independently

- **WHEN** an `@autokpo/app@*` tag and an `@autokpo/website@*` tag are pushed together
- **THEN** the app and website deploys run independently without blocking each other

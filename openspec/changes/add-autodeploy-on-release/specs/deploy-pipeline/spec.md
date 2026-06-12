## ADDED Requirements

### Requirement: Reusable deploy workflow

The system SHALL provide a reusable `.github/workflows/deploy.yml` (`on: workflow_call`) that deploys a monorepo package to Cloudflare. It SHALL accept inputs `package`, `wrangler-env` (default empty), `run-migrations` (default false), and `environment`, and the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Its body SHALL be package-agnostic (no hardcoded package paths), building and deploying the package identified by `package`.

#### Scenario: Workflow is callable with package inputs

- **WHEN** another workflow calls `deploy.yml` with a `package`, `environment`, and the Cloudflare secrets
- **THEN** the reusable workflow builds and deploys that package to Cloudflare

#### Scenario: Migration step is conditional

- **WHEN** the reusable workflow runs with `run-migrations: false`
- **THEN** no database migration step runs

#### Scenario: Environment flag is conditional

- **WHEN** `wrangler-env` is empty
- **THEN** `wrangler deploy` runs without an `--env` flag; when `wrangler-env` is set, deploy passes `--env <value>`

### Requirement: App deployed on its release tag with migrations

The system SHALL provide `.github/workflows/deploy-app.yml` triggered on push of tags matching `@autokpo/app@*`, which calls the reusable workflow with `package: '@autokpo/app'`, `wrangler-env: production`, `run-migrations: true`, and `environment: production`. It SHALL apply D1 migrations to the production database before deploying the worker.

#### Scenario: App tag triggers app deploy with migration

- **WHEN** a tag matching `@autokpo/app@*` is pushed
- **THEN** the app deploy runs and applies D1 migrations before deploying the worker

#### Scenario: Migrations target the production database

- **WHEN** the app migration step runs
- **THEN** it runs `wrangler d1 migrations apply DB --remote --env production`, applying to `autokpo-database` (the `env.production` binding), not `autokpo-database-dev`

#### Scenario: Migration failure aborts app deploy

- **WHEN** the production migration step exits non-zero
- **THEN** the worker deploy step does not run and the workflow fails

#### Scenario: Pending migrations are visible before applying

- **WHEN** the app deploy reaches the migration step
- **THEN** it lists pending migrations (`wrangler d1 migrations list --remote --env production`) in the run log before applying them

### Requirement: Website deployed on its release tag without migrations

The system SHALL provide `.github/workflows/deploy-website.yml` triggered on push of tags matching `@autokpo/website@*`, which calls the reusable workflow with `package: '@autokpo/website'`, `run-migrations: false`, and `environment: production`. It SHALL build and deploy the static site with no migration step and no `--env` flag.

#### Scenario: Website tag triggers website deploy

- **WHEN** a tag matching `@autokpo/website@*` is pushed
- **THEN** the website deploy builds the Astro site and runs `wrangler deploy` with no migration step and no `--env` flag

### Requirement: Deploy tag isolation

Each caller workflow SHALL respond only to its own package's tag. An app release tag SHALL NOT deploy the website, and a website release tag SHALL NOT deploy the app.

#### Scenario: App tag does not deploy website

- **WHEN** a tag matching `@autokpo/app@*` is pushed
- **THEN** the website deploy workflow does not run

#### Scenario: Website tag does not deploy app

- **WHEN** a tag matching `@autokpo/website@*` is pushed
- **THEN** the app deploy workflow does not run

### Requirement: Clean cache-free build

The reusable deploy workflow SHALL install dependencies with no restored cache (setup action with `cache: false`, no Turborepo cache) and build the target package from scratch before deploying. It SHALL NOT reuse build output or caches produced by `ci-cd.yml`, and SHALL NOT re-run lint or test — those gate the code at PR time, and the clean build (not the tests) is what protects against cache poisoning.

#### Scenario: Dependencies install clean

- **WHEN** a deploy runs
- **THEN** it invokes the setup action with `cache: false` and does not restore the pnpm store or `.turbo/cache`

#### Scenario: Build runs before deploy

- **WHEN** a deploy runs
- **THEN** the target package is built (`turbo build --filter=<package>`) from the clean install and must succeed before the migrate (if any) and deploy steps run

#### Scenario: Lint and test are not re-run

- **WHEN** a deploy runs
- **THEN** it does not run lint or the test suite

### Requirement: Production environment for credential scoping

Both deploy callers SHALL run under `environment: production` so the Cloudflare credentials are scoped to deploy jobs and deployments are recorded in GitHub. The environment SHALL NOT impose a required-reviewer approval; deploys run unattended on a release tag, since the deliberate merge of the Changeset release PR already serves as the human checkpoint. Both packages SHALL require only `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

#### Scenario: Deploy runs without manual approval

- **WHEN** a deploy workflow starts for a release tag
- **THEN** it proceeds without waiting for a manual approval

#### Scenario: Credentials are environment-scoped

- **WHEN** a deploy job runs
- **THEN** `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are sourced from the `production` environment rather than being available to unrelated workflows

### Requirement: Serialized deploys per package

The reusable workflow SHALL use a concurrency group keyed by package that serializes deploys of the same package and does not cancel an in-progress deploy. Different packages SHALL be able to deploy concurrently.

#### Scenario: Same-package deploys are serialized

- **WHEN** a second release tag for the same package is pushed while its deploy is in progress
- **THEN** the second run waits for the first to finish rather than cancelling it

#### Scenario: Different packages deploy independently

- **WHEN** an `@autokpo/app@*` tag and an `@autokpo/website@*` tag are pushed together
- **THEN** the app and website deploys run independently without blocking each other

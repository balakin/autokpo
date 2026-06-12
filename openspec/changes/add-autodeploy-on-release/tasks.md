## 1. Cloudflare + GitHub setup (operator)

- [ ] 1.1 Create a Cloudflare API token scoped to D1 Edit + Workers Scripts Edit for the account hosting `autokpo-app` and `autokpo-website`
- [ ] 1.2 Create a GitHub `production` Environment (no required-reviewer rule)
- [ ] 1.3 Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as secrets on the `production` Environment

## 2. Package scripts

- [ ] 2.1 Add `db:migrate:prod` to `apps/app/package.json`: `wrangler d1 migrations apply DB --remote --env production`
- [ ] 2.2 Add `deploy` to `apps/app/package.json`: `wrangler deploy --env production`
- [ ] 2.3 Add `deploy` to `apps/website/package.json`: `wrangler deploy`

## 3. Reusable deploy workflow

- [ ] 3.1 Add `.github/workflows/deploy.yml` with `on: workflow_call`, inputs `package` (string), `wrangler-env` (string, default `''`), `run-migrations` (boolean, default `false`), `environment` (string), and secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`
- [ ] 3.2 Job uses `environment: ${{ inputs.environment }}` and `concurrency: { group: deploy-${{ inputs.package }}, cancel-in-progress: false }`
- [ ] 3.3 Use `./.github/actions/setup` with `cache: false`; restore no Turborepo cache
- [ ] 3.4 Build only the target package from the clean install (`turbo build --filter=${{ inputs.package }}`); no lint, no test
- [ ] 3.5 If `run-migrations`, list then apply migrations with `--env ${{ inputs.wrangler-env }}` via `pnpm --filter ${{ inputs.package }} exec`, before deploy; migration failure must abort deploy
- [ ] 3.6 Deploy via `pnpm --filter ${{ inputs.package }} exec wrangler deploy`, adding `--env ${{ inputs.wrangler-env }}` only when set, with the Cloudflare credentials in env

## 4. Caller workflows

- [ ] 4.1 Add `.github/workflows/deploy-app.yml` on `push: tags: ['@autokpo/app@*']` calling `deploy.yml` with `package: '@autokpo/app'`, `wrangler-env: production`, `run-migrations: true`, `environment: production`, `secrets: inherit`
- [ ] 4.2 Add `.github/workflows/deploy-website.yml` on `push: tags: ['@autokpo/website@*']` calling `deploy.yml` with `package: '@autokpo/website'`, `run-migrations: false`, `environment: production`, `secrets: inherit`
- [ ] 4.3 Confirm each tag pattern triggers only its own caller (app tag does not deploy website, and vice versa)

## 5. Migration safety guide

- [ ] 5.1 Add `apps/app/docs/migrations.md` with the migrate-first invariant, the safe/unsafe classification table, and edge-case recipes (rename, drop, NOT NULL, unique, type narrowing)
- [ ] 5.2 Reference the expand/contract rule from `apps/app/CLAUDE.md`

## 6. Docs

- [ ] 6.1 Replace the manual deployment steps in `apps/app/README.md` with the automated tag-triggered flow and link to `docs/migrations.md`
- [ ] 6.2 Update `apps/website/README.md` (or add a deployment note) describing the automated tag-triggered deploy

## 7. Verification

- [ ] 7.1 On the next `@autokpo/app@*` tag, confirm the app workflow runs build → list/apply migrations → deploy in order without manual approval
- [ ] 7.2 Confirm app migrations are applied to `autokpo-database` (production), not `autokpo-database-dev`
- [ ] 7.3 On the next `@autokpo/website@*` tag, confirm the website workflow runs build → deploy with no migration step
- [ ] 7.4 Confirm the deployed worker (`https://app.autokpo.com`) and website serve the new releases

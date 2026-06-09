## 1. Schema and Migration

- [x] 1.1 Add `session` sqliteTable to `worker/db/schema/auth.ts` with columns: `id`, `expiresAt`, `token` (unique), `createdAt`, `updatedAt`, `ipAddress`, `userAgent`, `userId` (FK → user, cascade delete), and an index on `userId`
- [x] 1.2 Add `sessionRelations` to `worker/db/schema/auth.ts` and update `userRelations` to include `sessions`
- [x] 1.3 Run `pnpm db:generate` to generate the D1 migration for the `session` table
- [x] 1.4 Run `pnpm db:migrate:local` to apply the migration locally

## 2. Remove secondaryStorage and AUTH_KV

- [x] 2.1 Remove the `secondaryStorage` block from `worker/auth/auth.ts`
- [x] 2.2 Remove the `secondaryStorage` stub from `auth.config.ts`
- [x] 2.3 Remove the `secondaryStorage` block from `tests/worker/auth-helpers.ts`
- [x] 2.4 Remove `kv_namespaces` entries from `wrangler.jsonc` (both base env and `env.production`)
- [x] 2.5 Run `pnpm generate:worker-types` to regenerate `worker-configuration.d.ts` without `AUTH_KV`

## 3. Tests

- [x] 3.1 Run auth tests to confirm session creation and lookup work against D1 (`pnpm -s test worker/auth --reporter=verbose`)
- [x] 3.2 Run full test suite to confirm no regressions (`pnpm -s test --reporter=verbose | tail -n 120`)

## 4. Privacy Policy

- [x] 4.1 Update English privacy policy (`apps/website/src/pages/en/privacy/index.md`) — sessions row in retention table and Cloudflare row in service providers table to reflect D1-only storage
- [x] 4.2 Update Russian privacy policy (`apps/website/src/pages/ru/privacy/index.md`) with the same changes
- [x] 4.3 Update Serbian privacy policy (`apps/website/src/pages/privacy/index.md`) with the same changes
- [x] 4.4 Update `updated` date in all three privacy policy files

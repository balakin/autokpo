## 1. Wrangler Config

- [ ] 1.1 Add `kv_namespaces` entry with `AUTH_KV` binding (dev namespace) to `wrangler.jsonc`
- [ ] 1.2 Add `AUTH_KV` KV namespace override under `env.production` in `wrangler.jsonc`
- [ ] 1.3 Run `generate:worker-types` to update the `Env` interface

## 2. Auth Config

- [ ] 2.1 Add `secondaryStorage` to `betterAuth()` in `worker/auth.ts` using `env.AUTH_KV`

## 3. Schema Cleanup (manual)

- [ ] 3.1 Remove `session` table, `sessionRelations`, and `userRelations.sessions` from `worker/db/schema/auth.ts`
- [ ] 3.2 Remove `verification` table from `worker/db/schema/auth.ts`
- [ ] 3.3 Update D1 migration to drop `session` and `verification` tables
- [ ] 3.4 Run `db:migrate:local` and verify worker builds cleanly

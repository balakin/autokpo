## Context

better-auth's `secondaryStorage` interface routes session creation and lookup through an external key-value store instead of the primary database. The app configured this with a Cloudflare KV namespace (`AUTH_KV`). KV is globally replicated — data is distributed to every Cloudflare edge node worldwide, not just the EU region where D1 is configured.

The `session` table therefore does not exist in D1 today; the Drizzle schema has no session model. Removing `secondaryStorage` causes better-auth to fall back to the primary D1 adapter for sessions, but a `session` table must exist first.

OTP verification records are already stored in D1 — `verification: { storeInDatabase: true }` in `auth-options.ts` overrides `secondaryStorage` for that model. The existing `cloudflare-kv-session-storage` spec incorrectly documents verification as also using KV; that was superseded earlier.

## Goals / Non-Goals

**Goals:**

- Store sessions in D1, eliminating the KV dependency entirely
- Remove the `AUTH_KV` binding from wrangler config and worker types
- Keep all user data in EU-stored infrastructure (D1)

**Non-Goals:**

- Changing session TTL, expiry, or rotation behavior
- Adding a secondary cache for sessions (e.g., D1-backed KV table)
- Data migration — the app is not yet in production, so no live sessions exist

## Decisions

### 1. Add `session` table to Drizzle schema, generate migration

**Decision**: Add a `session` sqliteTable to `worker/db/schema/auth.ts` matching better-auth's expected schema (columns: `id`, `expiresAt`, `token`, `createdAt`, `updatedAt`, `ipAddress`, `userAgent`, `userId`). Run `db:generate` to produce the migration.

**Rationale**: Without this table, removing `secondaryStorage` causes better-auth to attempt writes to a non-existent D1 table and fail at runtime. The schema columns are derived directly from better-auth's `getAuthTables({}).session.fields`.

**Alternative considered**: `session.storeSessionInDatabase: true` while keeping `secondaryStorage`. This stores sessions in both places, which doesn't eliminate KV and adds write overhead. Rejected.

### 2. Remove `secondaryStorage` entirely

**Decision**: Delete the `secondaryStorage` block from `worker/auth/auth.ts`, `auth.config.ts`, and `tests/worker/auth-helpers.ts`.

**Rationale**: No caching benefit is needed at current traffic. D1 is low-latency for the EU region. Keeping KV only for read caching would retain the global-storage privacy issue while adding complexity.

### 3. Remove `kv_namespaces` from wrangler.jsonc, regenerate types

**Decision**: Delete `kv_namespaces` entries from both the base env and `env.production` in `wrangler.jsonc`, then run `pnpm generate:worker-types`.

**Rationale**: With no `secondaryStorage` referencing `AUTH_KV`, the binding is dead infrastructure. Leaving it in the config would require provisioning a KV namespace that is never used.

## Risks / Trade-offs

**Session reads now hit D1 on every authenticated request** → D1 latency for EU users is low and acceptable. No mitigation needed at current scale.

**`cloudflare-kv-session-storage` spec is partly stale (verification claim)** → The spec update in this change corrects the record; it's a documentation-only issue with no runtime impact.

## Migration Plan

No data migration needed — the app is pre-launch with no production users.

1. Add `session` table to schema and generate migration (`db:generate`)
2. Remove `secondaryStorage` from `auth.ts`, `auth.config.ts`, test helpers
3. Remove `kv_namespaces` from `wrangler.jsonc`
4. Regenerate worker types (`generate:worker-types`)
5. Apply migration locally (`db:migrate:local`) and run tests
6. Update privacy policy text
7. On deploy: run `db:migrate:remote` before worker deploy

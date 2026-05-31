## Context

better-auth is configured with a Drizzle/D1 primary database. By default it stores sessions and OTP verification records in D1 tables (`session`, `verification`). Every `getSession()` call — which runs on every authenticated request — issues a D1 read. D1 reads have latency (~40–80ms) and count against the D1 free-tier quota.

better-auth exposes a `secondaryStorage` option: a simple `{ get, set, delete }` interface. When provided, sessions and verification records are stored there instead of the primary database. Cloudflare KV maps directly onto this interface.

The app is pre-release, so no data migration is needed.

## Goals / Non-Goals

**Goals:**

- Move session and verification record storage from D1 to Cloudflare KV
- Reduce D1 read quota consumption and authenticated-request latency
- Keep the change minimal: wrangler config + auth config only

**Non-Goals:**

- Cookie cache / stateless session mode (not needed now)
- Rate limiting via KV (rate limiting is disabled)
- Any client-side or API contract changes

## Decisions

### Decision: Use KV as secondary storage, not primary

better-auth supports running with no primary database at all (secondaryStorage-only). We keep D1 as primary because `user` and `account` records belong there — they are long-lived relational data, not ephemeral key-value data.

**Alternative considered**: KV-only (no D1 for auth). Rejected because `user`/`account` tables have relational integrity requirements (foreign keys, cascade deletes) that KV cannot enforce.

### Decision: Drop `session` and `verification` tables from D1 schema

Once `secondaryStorage` is configured, better-auth writes nothing to these tables. Since the app is pre-release, remove them from the Drizzle schema and migration rather than leaving dead tables.

**Alternative considered**: Keep tables, set `storeSessionInDatabase: false` explicitly. Rejected — dead schema adds confusion with no benefit.

### Decision: Two KV namespaces (dev + production), matching D1 pattern

`wrangler.jsonc` already uses a top-level dev binding and a `env.production` override for D1. Apply the same pattern for `AUTH_KV` so local dev and production are isolated.

## Risks / Trade-offs

- **KV eventual consistency on revocation** → A revoked session token may remain valid at edge locations for up to ~60 seconds. For a personal tax document app this is acceptable.
- **KV free tier write limit (1k/day)** → Sessions are write-once + one refresh every 7 days (`updateAge`). Low-traffic app; this limit is not a practical concern.
- **`session`/`verification` table removal is irreversible** → Pre-release: no production data exists, so rollback would just re-add the schema.

## Migration Plan

1. Add `AUTH_KV` binding to `wrangler.jsonc` (dev + production namespaces)
2. Run `generate:worker-types` to update `Env`
3. Add `secondaryStorage` to `betterAuth()` in `worker/auth.ts`
4. Remove `session` and `verification` tables from `worker/db/schema/auth.ts` (manual)
5. Update D1 migration SQL to drop those tables (manual)
6. Run `db:migrate:local` to verify

Rollback: revert `secondaryStorage`, restore schema tables, re-run migration.

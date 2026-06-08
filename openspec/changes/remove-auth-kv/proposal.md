## Why

Cloudflare KV is globally replicated storage — session tokens (authentication credentials) are cached at every edge node worldwide, not just in the EU where D1 is stored. This contradicts the privacy policy's guarantee that data is processed through EU-stored infrastructure, and adds an unnecessary infrastructure dependency. Sessions can be stored directly in D1 with no functionality loss.

## What Changes

- Remove `secondaryStorage` (KV-backed) from the better-auth configuration; sessions go to D1 instead
- Add `session` table to the Drizzle schema and generate a D1 migration
- Remove the `AUTH_KV` KV namespace binding from `wrangler.jsonc` and regenerate worker types
- Remove `AUTH_KV` stubs from `auth.config.ts` and test helpers
- Retire the `cloudflare-kv-session-storage` spec and update the privacy policy to reflect EU-only session storage

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cloudflare-kv-session-storage`: Sessions now stored in D1 (`session` table) instead of Cloudflare KV. The KV namespace and `secondaryStorage` configuration are removed entirely.

## Impact

- `worker/auth/auth.ts` — remove `secondaryStorage` block
- `worker/db/schema/auth.ts` — add `session` table
- `worker/db/migrations/` — new migration for `session` table
- `wrangler.jsonc` — remove `kv_namespaces` entries (both base and `env.production`)
- `worker-configuration.d.ts` — regenerated to drop `AUTH_KV`
- `auth.config.ts` — remove `secondaryStorage` stub
- `tests/worker/auth-helpers.ts` — remove KV stubs from `testAuth`
- Privacy policy (en/ru/sr-Latn) — reflect that all session data is stored in EU-located D1
- `openspec/specs/cloudflare-kv-session-storage/spec.md` — update to reflect D1-backed sessions

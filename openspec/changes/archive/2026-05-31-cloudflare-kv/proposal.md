## Why

Session lookups hit D1 on every authenticated request, consuming D1 read quota and adding latency. Cloudflare KV serves reads from the edge and is a natural fit for better-auth's `secondaryStorage` interface, which moves sessions and OTP verification records out of D1 entirely.

## What Changes

- Add a Cloudflare KV namespace binding (`AUTH_KV`) to `wrangler.jsonc`
- Wire `secondaryStorage` in `worker/auth.ts` using the KV binding
- Drop the `session` and `verification` tables from the D1 schema (manual — app is pre-release, no migration needed)

## Capabilities

### New Capabilities

- `cloudflare-kv-session-storage`: Sessions and verification records stored in KV instead of D1; all session reads served from the edge

### Modified Capabilities

<!-- No existing spec-level requirements change. Session management behavior (listing, revoking) remains unchanged — the storage backend is an implementation detail. -->

## Impact

- `wrangler.jsonc`: new `kv_namespaces` entry + `Env` type update
- `worker/auth.ts`: add `secondaryStorage` option to `betterAuth()`
- `worker/db/schema/auth.ts`: remove `session` and `verification` tables (manual)
- D1 migrations: remove session/verification table DDL (manual)
- No client-side changes
- No API contract changes

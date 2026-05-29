## Why

Non-auth backend endpoints already validate encrypted payload sizes before persistence, but several JSON routes parse and decode request bodies before the size checks run. Adding explicit request-body and database size limits reduces memory/CPU abuse risk and prevents future drift between runtime validators and persisted encrypted blob constraints.

## What Changes

- Add pre-parse body-size limits for non-auth JSON endpoints that accept encrypted payloads.
- Add pre-decode base64 string limits consistent with the existing decoded byte limits.
- Share encrypted payload size constants between route validation and D1 schema definitions.
- Add database size constraints for custom encrypted tables only:
  - sync record ciphertext rows must fit the sync ciphertext limit.
  - key-ring ciphertext rows must fit the key-ring ciphertext limit.
  - password wrapper salts and wrapped MEK ciphertext must match their fixed byte sizes.
- No changes to `/api/auth/*` behavior in this change.

## Capabilities

### New Capabilities

- `backend-payload-limits`: Non-auth backend JSON endpoints reject oversized encrypted payload requests before parsing and persist only encrypted blobs that satisfy configured size limits.

### Modified Capabilities

- `sync-encryption`: Sync push and compact uploads gain explicit request-body, base64 string, and D1 ciphertext size requirements.
- `e2ee-key-ring`: Key-ring setup, update, and password-wrapper mutation requests gain explicit request-body, base64 string, and D1 blob size requirements.

## Impact

- Affected Worker routes: `apps/app/worker/main.ts`, `apps/app/worker/routes/sync.ts`, `apps/app/worker/routes/e2ee.ts`.
- Affected D1 schema and migrations: `apps/app/worker/db/schema/sync-record.ts`, `apps/app/worker/db/schema/encryption.ts`, generated migration files.
- Affected tests: worker route tests for oversized body/string rejection and schema/migration behavior where practical.
- New dependency usage: Hono built-in `bodyLimit` middleware; no new package dependency expected.

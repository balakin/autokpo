## Why

Current D1 write endpoints mix preflight reads with later writes for key-ring, password-wrapper, push, and compact mutations. Those check-then-write paths can race concurrent requests, so we need a consistent atomic batch pattern before adding more key-ring and sync concurrency behavior.

## What Changes

- Add a generic `tx_assert` Drizzle table with a DB `CHECK` constraint used to intentionally abort D1 batches when a required postcondition is not true.
- Rewrite existing write endpoints to use D1 `db.batch()` as the transaction boundary:
  - `POST /api/e2ee/key-ring`
  - `POST /api/e2ee/key-ring/change-password`
  - `POST /api/sync`
  - `POST /api/sync/compact`
- Preserve current public API semantics and error codes while moving concurrency-sensitive checks into the database write path.
- Prefer Drizzle query builders and schema references; use raw SQL only for conditional assertion statements that are not practical with the high-level API.
- No new product feature, protocol change, key rotation, or breaking API change is introduced by this refactor.

## Capabilities

### New Capabilities

- `atomic-d1-write-batches`: Defines the shared database assertion and D1 batch transaction behavior used by backend write endpoints.

### Modified Capabilities

- `e2ee-key-ring`: Key-ring setup and master-password wrapper replacement SHALL be persisted with atomic D1 batch semantics instead of check-then-write authority.
- `sync-encryption`: Push and compact writes SHALL enforce encryption-key/head preconditions at write time and rollback partial sync mutations on conflict.

## Impact

- Affected worker routes: `worker/routes/e2ee.ts`, `worker/routes/sync.ts`.
- Affected database schema/migrations: add `tx_assert` to Drizzle schema and D1 migrations.
- Affected tests: worker E2EE route tests and sync route/client tests for duplicate setup, stale wrapper conflict, active-DEK mismatch, compact conflict, and idempotency behavior.
- No new runtime dependency is expected.

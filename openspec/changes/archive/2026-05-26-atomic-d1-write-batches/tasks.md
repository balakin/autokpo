## 1. Database Assertion Infrastructure

- [x] 1.1 Add a Drizzle `txAssert` schema table with an `ok` integer column constrained to `ok = 1`.
- [x] 1.2 Generate and review the D1 migration that creates `tx_assert` with the required check constraint.
- [x] 1.3 Add a small route-local or worker DB helper pattern for conditional batch assertions that references Drizzle schema objects and uses raw SQL only where needed.

## 2. E2EE Key-Ring Endpoints

- [x] 2.1 Rewrite `POST /api/e2ee/key-ring` to persist key-ring setup with a single `db.batch()` containing the key-ring insert and initial password-wrapper insert.
- [x] 2.2 Preserve duplicate setup handling by relying on database uniqueness and mapping constraint failures to the existing conflict response.
- [x] 2.3 Rewrite `POST /api/e2ee/key-ring/change-password` to use a revoke/assert/insert `db.batch()` for active password-wrapper replacement.
- [x] 2.4 Preserve stale-wrapper conflict behavior and ensure failed replacement does not leave a partial wrapper mutation.

## 3. Sync Write Endpoints

- [x] 3.1 Rewrite `POST /api/sync` so new push rows are inserted only when the submitted `encryptionKeyId` is still active at database write time.
- [x] 3.2 Preserve push idempotency behavior for duplicate ids with matching payloads and conflicting payloads.
- [x] 3.3 Rewrite `POST /api/sync/compact` so snapshot insertion and covered-row deletion execute in one guarded `db.batch()`.
- [x] 3.4 Preserve compact head conflict, idempotency conflict, active-key mismatch, compact hint, and storage-limit behavior.

## 4. Tests and Verification

- [x] 4.1 Add or update worker E2EE tests for atomic setup and stale password-wrapper replacement rollback.
- [x] 4.2 Add or update sync route tests for active-DEK push checks at write time, duplicate push idempotency, and compact rollback behavior.
- [x] 4.3 Run targeted worker route tests with Vitest verbose reporter.
- [x] 4.4 Run broader app tests or relevant regression checks after endpoint migrations are complete.

## 5. Review

- [x] 5.1 Review raw SQL usage to confirm table and field names come from Drizzle schema objects where practical.
- [x] 5.2 Review public API responses to confirm existing request/response contracts and error code meanings are unchanged.

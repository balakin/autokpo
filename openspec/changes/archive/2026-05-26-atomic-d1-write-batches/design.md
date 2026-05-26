## Context

The Worker currently persists E2EE key-ring state and encrypted sync records in Cloudflare D1 through Drizzle. Several write endpoints perform an application-level read or validation before a later write: initial key-ring setup checks for an existing row, password change reads the active wrapper before replacing it, push checks the active DEK before inserting a sync row, and compact reads sync metadata before inserting a snapshot and deleting old rows.

D1 supports atomic multi-statement execution through `db.batch()`, but it does not provide an interactive transaction API where application code can inspect an update count and decide to rollback mid-transaction. A zero-row `UPDATE` or conditional `INSERT` is not an error by itself, so stale preconditions must be converted into an actual database error inside the batch when rollback is required.

## Goals / Non-Goals

**Goals:**

- Make all current backend write endpoints rely on D1 batch transactions for multi-step persistence.
- Move concurrency-sensitive preconditions into the database write path instead of using preflight reads as authority.
- Add one generic Drizzle-managed assertion table that can intentionally abort a batch through a `CHECK` constraint.
- Preserve existing API request/response shapes and public error semantics.
- Prefer Drizzle builders and schema references, with raw SQL limited to conditional assertion statements or SQL expressions that the builder API cannot represent clearly.

**Non-Goals:**

- Add DEK rotation, key-ring revisions, or new sync protocol fields.
- Change client-visible endpoint contracts except for preserving existing errors more reliably under races.
- Introduce Durable Objects or move sync/key-ring storage out of D1.
- Redesign compaction retention policy.

## Decisions

### Use `db.batch()` as the transaction boundary

D1 documents batched statements as sequential, transactional execution: if one statement fails, the sequence rolls back. This matches the current Worker/Drizzle stack and avoids adding another consistency layer.

Alternatives considered:

- `db.transaction()`: Drizzle has a generic transaction API, but D1 does not provide classic interactive transactions for Workers. It is not the right primitive for row-count-dependent rollback logic here.
- Durable Objects as per-user locks: they serialize requests but do not remove the need for atomic D1 writes when D1 remains storage.
- Raw multi-statement SQL scripts: difficult to parameterize safely for encrypted blobs and less aligned with Drizzle-managed schema.

### Add a generic `tx_assert` table

Add a Drizzle schema table:

```ts
txAssert(ok integer not null check ok = 1)
```

Assertion statements insert `0` only when a required condition is false. The check constraint raises an SQL error, causing D1 to rollback the whole batch.

Example pattern:

```sql
INSERT INTO tx_assert(ok)
SELECT 0
WHERE NOT EXISTS (... required postcondition ...)
```

The table is not domain data. It is a small database-level rollback primitive shared by all write endpoints.

### Keep raw SQL narrow and schema-referenced

Most writes should remain Drizzle builder calls (`insert`, `update`, `delete`). Conditional assertions may use `db.run(sql`...`)` because `INSERT ... SELECT 0 WHERE NOT EXISTS (...)` is awkward in the high-level API. Raw SQL must reference Drizzle schema objects (`${txAssert}`, `${txAssert.ok}`, `${keyRingWrapping.userId}`, etc.) rather than hard-coded table and column strings where possible.

### Endpoint-specific batch shapes

`POST /api/e2ee/key-ring` should batch the key-ring insert and password-wrapper insert. Unique constraints remain the authority for duplicate setup races.

`POST /api/e2ee/key-ring/change-password` should batch: revoke the expected active wrapper, assert that wrapper is revoked, then insert the replacement active wrapper. This enforces compare-and-swap semantics even if no active wrapper exists or the active wrapper changed concurrently.

`POST /api/sync` should make the active-DEK check part of the insert path, not a prior authoritative read. Existing idempotency behavior must be preserved: identical duplicate IDs succeed, different duplicate IDs conflict, and stale encryption keys fail with the existing mismatch code.

`POST /api/sync/compact` should batch compaction mutations so a failed head/precondition check, snapshot insert, or delete cannot leave partial sync state. Existing head conflict, idempotency conflict, and storage-limit behavior should remain externally consistent.

### Use diagnostic reads after batch failures

Because assertion failures and constraint failures both surface as thrown D1/Drizzle errors, handlers may perform follow-up reads after a failed batch to map the result to existing public error codes. Those diagnostics are not used as write authority and therefore do not reintroduce the original race.

## Risks / Trade-offs

- Assertion failures may initially be harder to distinguish from other DB failures → map errors through post-failure diagnostics and keep public error codes stable.
- Raw SQL cannot be eliminated entirely → restrict it to small assertion statements and use Drizzle schema interpolation for identifiers.
- `tx_assert` is an unusual table with no business data → document it in schema comments/tests and keep it generic.
- Some sync idempotency cases are subtle under races → add worker route tests for duplicate IDs, stale active keys, and compact conflicts.

## Migration Plan

1. Add the Drizzle `txAssert` schema and generate a D1 migration creating the `tx_assert` table with `CHECK (ok = 1)`.
2. Update write endpoints one at a time, preserving current request parsing and response mapping.
3. Add/adjust worker tests around race-like stale preconditions and idempotency behavior.
4. Run targeted worker tests, then the app test suite.

Rollback is straightforward before deployment by reverting the migration and route changes. After deployment, the `tx_assert` table is inert unless referenced by route code.

## Open Questions

- Whether to add a dedicated helper function for assertion SQL now or keep assertions inline until patterns settle.
- Whether push active-DEK enforcement should eventually move into a database trigger; this proposal keeps it in endpoint batch logic for a smaller migration.

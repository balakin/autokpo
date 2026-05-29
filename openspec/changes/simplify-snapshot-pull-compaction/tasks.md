## 1. Server Pull Semantics

- [x] 1.1 Update `GET /api/sync` metadata lookup to derive the current head and latest snapshot sequence for the authenticated user.
- [x] 1.2 Change cursor `0` pull selection to return the latest snapshot plus rows after it, or all rows when no snapshot exists.
- [x] 1.3 Change stale cursor handling so `since > 0 && since < latestSnapshotSeq` returns `410 Gone`.
- [x] 1.4 Preserve normal incremental pulls for cursors at or after the latest snapshot, including `304 Not Modified` and `ETag` behavior.

## 2. Server Compact Semantics

- [x] 2.1 Remove retained-tail cutoff calculation from compact insertion/deletion flow.
- [x] 2.2 Delete all sync records with `seq <= X-Replaces-Up-To` after accepting a compact snapshot.
- [x] 2.3 Remove unused tail helper code and update comments to describe snapshot-baseline recovery.

## 3. Tests and Documentation

- [x] 3.1 Update worker sync tests for fresh pull with latest snapshot plus subsequent rows.
- [x] 3.2 Update worker sync tests for cursor older than latest snapshot returning `410`.
- [x] 3.3 Update compact tests to assert covered rows are fully deleted and no pre-snapshot tail is retained.
- [x] 3.4 Update sync documentation to describe latest-snapshot baseline pulls and simplified compaction deletion.

## 4. Verification

- [x] 4.1 Run scoped worker sync tests for `apps/app/worker/__tests__/sync.spec.ts`.
- [x] 4.2 Run relevant CRDT sync client/state tests if client recovery behavior changes.
- [x] 4.3 Run the app test suite or targeted regression checks required by the final implementation scope.

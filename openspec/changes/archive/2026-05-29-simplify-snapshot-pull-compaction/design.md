## Context

Remote sync stores a dense per-user sequence of encrypted `update` and `snapshot` rows in D1. The client pulls with `If-None-Match` as a cursor, applies returned records to its Y.Doc, and stores the response `ETag` as the new cursor. On `410 Gone`, the client resets only sync metadata and retries from cursor `0`; the local Y.Doc is preserved so offline edits can merge with remote state.

Current compaction inserts a full snapshot and then keeps a bounded tail of older rows so slightly stale clients can often catch up without `410`. That optimization makes pull behavior more complex and causes fresh/reset clients to download redundant rows before applying a snapshot. It is also unsafe to treat snapshots as optional for existing clients because compact can be used as a write path: when a local delta is too large, the client sends a snapshot instead of an update, so some changes may exist only inside the snapshot row.

## Goals / Non-Goals

**Goals:**

- Treat the latest snapshot as the authoritative baseline for clients that do not already have a cursor at or beyond it.
- Make fresh and 410-recovery pulls transfer only the latest baseline snapshot plus subsequent rows.
- Make stale clients use one recovery path: `410` → reset sync metadata → pull from cursor `0`.
- Delete all compacted records covered by `X-Replaces-Up-To`; remove retained-tail cutoff logic.
- Preserve existing local-first guarantees: 410 recovery must not wipe local Y.Doc contents or pending dirty state.

**Non-Goals:**

- Changing the sync record schema or sequence numbering model.
- Changing encryption envelope format, AAD, DEK rotation, or key-ring conflict handling.
- Introducing server-side diffing, per-client state, or snapshot chunking.
- Optimizing bandwidth for clients that are slightly behind a compacted snapshot.

## Decisions

### Latest snapshot is a baseline boundary

Pull behavior should branch around the latest snapshot sequence:

```text
latestSnapshotSeq = max(seq where kind = 'snapshot')

since = 0:
  if latest snapshot exists:
    return latest snapshot + rows with seq > latestSnapshotSeq
  else:
    return all rows

since > 0 and latest snapshot exists and since < latestSnapshotSeq:
  return 410

otherwise:
  return rows with seq > since
```

Rationale: a snapshot may include changes that have no corresponding update row, so any client behind the snapshot must apply it. Clients at or beyond the snapshot can continue incrementally because their local document state is already equivalent through that baseline.

Alternative considered: skip snapshots for normal incremental pulls and advance the ETag over omitted snapshot rows. Rejected because compact-as-large-delta means snapshot rows can contain unique changes.

### Compaction deletes all records up to `X-Replaces-Up-To`

After the server accepts and inserts a snapshot, it should delete records with `seq <= replacesUpTo` for that user. The retained-tail calculation and bounded pre-snapshot deletion cutoff are no longer part of the protocol.

Rationale: once clients behind the snapshot are required to recover through the snapshot, retaining pre-snapshot rows provides little value and preserves the redundant/ambiguous path this change removes.

Alternative considered: keep the tail but still require stale clients to use snapshots. Rejected as unnecessary storage and implementation complexity.

### Keep client 410 semantics unchanged

The client should continue to handle `410` by resetting sync metadata to cursor `0`, nulling the state vector, preserving `dirty`, and retrying pull. The subsequent cursor-0 response applies the latest snapshot and later rows to the existing Y.Doc.

Rationale: Yjs update application is idempotent/commutative, and preserving local state is essential for offline edits that have not been pushed yet.

## Risks / Trade-offs

- Slightly stale clients download full snapshots more often → Accept the bandwidth cost for simpler and safer semantics; compaction is already a storage/bandwidth trade-off point.
- Large snapshots may be expensive on slow networks → Existing max payload limits remain; future work can consider snapshot chunking if needed.
- Existing tests/documentation may encode retained-tail behavior → Update them to express snapshot-baseline behavior instead of tail catch-up.
- If latest-snapshot query and row query are inconsistent under concurrent writes → Use a single database batch/read path that derives metadata and returned records consistently enough for current D1 semantics; ETag remains the actual head.

## Migration Plan

No data migration is required. Existing rows remain valid. After deployment, future compactions will delete covered rows fully. Existing retained tails from older compactions can remain until a later compaction deletes them, or can simply be ignored by the new pull selection logic.

Rollback is low risk: older server logic can still read existing `update` and `snapshot` rows. Clients already understand `410` and snapshot records.

## Open Questions

- Should old retained rows before the latest snapshot be proactively cleaned on the first new compact, or is natural cleanup on future compactions sufficient?

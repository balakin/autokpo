## Why

The current remote sync compaction keeps a retained tail before each snapshot, causing new or stale clients to download redundant update rows before applying a full snapshot. More importantly, snapshots can contain changes that were never uploaded as update rows, so treating retained tail rows as an alternative to snapshot replay creates unsafe pull semantics.

## What Changes

- Simplify server pull behavior around remote snapshots:
  - fresh pulls (`since = 0`) return the latest snapshot plus rows after it, or all rows when no snapshot exists;
  - clients whose cursor is behind the latest snapshot receive `410 Gone` and recover by resetting sync metadata and pulling from scratch;
  - clients at or after the latest snapshot continue normal incremental pulls.
- Simplify server compaction deletion:
  - after inserting a snapshot, delete all records covered by `X-Replaces-Up-To` instead of preserving a bounded pre-snapshot tail.
- Preserve existing client 410 recovery behavior: reset sync metadata only, keep local Y.Doc content, retry with `since = 0`, and merge snapshot data with local/offline edits.
- Remove the retained-tail optimization and its associated counting logic from the protocol expectations.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `crdt-store`: Update remote pull and compact protocol requirements for snapshot-baseline recovery and full deletion of compacted rows.

## Impact

- Affected worker code: `apps/app/worker/routes/sync.ts` pull and compact handlers.
- Affected client code: existing 410 recovery path should remain compatible; tests may need updates to reflect simplified server behavior.
- Affected docs/specs: remote sync protocol documentation and `crdt-store` OpenSpec requirements.
- Operational impact: clients behind the latest snapshot will download a full snapshot instead of catching up from a retained tail; storage and server logic become simpler and safer.

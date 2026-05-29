## Why

Remote sync DEK rotation currently causes the local CRDT runtime to be destroyed and recreated because `CrdtProvider` depends on `activeDek` and `activeDekId`, even though local IndexedDB persistence uses a separate local persistence DEK wrapped by the MEK. During remote compaction, this unnecessary remount can reopen the local database, remount the sync engine, and trigger redundant pulls while compact is still in flight.

## What Changes

- Decouple local CRDT runtime lifecycle from remote sync active DEK changes.
- Keep local Y.Doc and encrypted IndexedDB persistence mounted when only `activeDek` / `activeDekId` changes.
- Keep sync engine access to fresh remote sync keys through `useEncryptionContext()` and refs, without remounting the local runtime.
- Preserve local runtime recreation when the signed-in user or MEK changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `crdt-store`: Clarify that local encrypted IndexedDB persistence SHALL depend on the user and MEK/local persistence DEK, not on the remote sync active DEK lifecycle.

## Impact

- Affected code: `apps/app/src/crdt/crdt-provider.tsx`.
- Affected behavior: remote key-ring rotation during sync compact should not destroy/reopen the local Y.Doc IndexedDB runtime or trigger sync-engine remount pulls.
- No storage schema, sync protocol, or encryption envelope changes.

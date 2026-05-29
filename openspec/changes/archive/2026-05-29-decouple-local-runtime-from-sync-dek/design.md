## Context

AutoKPO uses two distinct encryption domains:

- Remote sync encryption uses the E2EE key-ring active DEK (`activeDek`, `activeDekId`, `keyRingRevision`) for `/api/sync` update and snapshot rows.
- Local IndexedDB Y.Doc persistence uses a dedicated local persistence DEK stored in the Yjs IndexedDB database and wrapped by the MEK.

`CrdtProvider` currently creates the local CRDT runtime with only `userId` and `mek`, but its effect also depends on `activeDek` and `activeDekId`. When remote compact rotates the sync DEK, `EncryptionContext` updates, `CrdtProvider` destroys and recreates the local runtime, and `SyncEngine` remounts. That can trigger a pull during compact even though local persistence does not need to reopen.

## Goals / Non-Goals

**Goals:**

- Keep the local Y.Doc runtime and encrypted IndexedDB persistence stable across remote sync active DEK rotations.
- Continue recreating the local runtime when the user id or MEK changes.
- Continue updating `useSyncEngine` with fresh remote sync key material for push, compact, and pull decryption.
- Avoid remount-triggered pull invalidations caused solely by remote key-ring rotation.

**Non-Goals:**

- Changing key-ring rotation order during remote compact.
- Changing local IndexedDB encryption format, remote sync encryption format, or storage schemas.
- Changing 410 recovery behavior or snapshot pull semantics.
- Splitting `EncryptionContext` into multiple contexts in this change.

## Decisions

### Local CRDT runtime depends only on user id and MEK

`CrdtProvider` should destructure only `mek` from `useEncryptionContext()` and use `[mek, userId]` as the runtime effect dependencies.

Rationale: `createRuntime(userId, { mek, onReset })` only needs the MEK to unwrap/wrap the local persistence DEK. The remote sync active DEK is stored in the E2EE key-ring cache and used by the sync engine, but it is not used for local Y.Doc IndexedDB rows.

Alternative considered: delay publishing rotated remote sync keys until after compact completes. Rejected for this change because it creates a temporary mismatch between backend active DEK and frontend key context and treats the symptom rather than the local-runtime dependency bug.

### Sync engine continues to observe remote key changes

`SyncEngine` remains mounted under `CrdtProvider` and continues to call `useSyncEngine()`. `useSyncEngine()` consumes `useEncryptionContext()` directly and writes key fields into refs each render, so remote key changes update future push/compact/decrypt operations without recreating the local runtime.

Rationale: re-rendering is enough to update refs; remounting is not required and is harmful because mount/leader effects can trigger pulls.

## Risks / Trade-offs

- If local persistence ever starts depending on remote sync DEKs, this dependency split would become invalid → Preserve the spec requirement that local IndexedDB persistence uses a dedicated local persistence DEK distinct from the remote sync DEK.
- `CrdtProvider` will still re-render when `EncryptionContext` changes → Acceptable; the important behavior is that the runtime effect does not tear down the local DB.
- Tests may not currently detect runtime teardown on key rotation → Add a focused regression test or adjust an existing provider test to cover stable runtime behavior when only `activeDekId` changes.

## Migration Plan

No data migration is required. This is a runtime lifecycle fix only. Rollback restores the old dependency behavior but may reintroduce redundant local DB reopen/pull activity during remote key rotation.

## 1. Runtime Dependency Cleanup

- [ ] 1.1 Update `CrdtProvider` to consume only the MEK needed by local encrypted IndexedDB persistence.
- [ ] 1.2 Remove `activeDek` and `activeDekId` from the local runtime creation effect dependencies.
- [ ] 1.3 Confirm `useSyncEngine` continues to receive updated remote sync key material through `useEncryptionContext()` without remounting the CRDT runtime.

## 2. Regression Coverage

- [ ] 2.1 Add or update a focused test proving remote `activeDekId` changes do not destroy/recreate the local CRDT runtime when `userId` and `mek` are unchanged.
- [ ] 2.2 Preserve coverage that MEK or user changes still recreate the local runtime.

## 3. Verification

- [ ] 3.1 Run the relevant CRDT/provider test file.
- [ ] 3.2 Run a targeted build or typecheck for the app package.

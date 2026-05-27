## Why

The encrypted key ring is created once today and cannot be updated safely. Key-ring mutations need optimistic concurrency so future active-DEK changes and encrypted key-ring content changes cannot overwrite each other across tabs/devices.

## What Changes

- Add a key-ring `revision` that starts at `1`, is returned in serialized key-ring profiles, and increments on key-ring mutations.
- Add `PUT /api/e2ee/key-ring` to replace the encrypted key-ring payload when the submitted `currentRevision` matches the stored revision.
- Persist key-ring updates through a guarded D1 batch so stale revisions roll back and return `409 { "code": "key_ring_revision_conflict" }`.
- Include the key-ring revision inside the encrypted key-ring plaintext and in the AES-GCM AAD for key-ring ciphertext.
- Update client key-ring parsing/decryption so plaintext `revision` and `activeDekId` must match the serialized key-ring metadata.
- On key-ring update conflict, refetch the latest key-ring profile and update the encrypted local cache without automatically retrying the mutation.
- Keep this change limited to key-ring mutation support; it does not add DEK rotation UX or automatic DEK rotation behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `e2ee-key-ring`: add revisioned key-ring updates, revision-bound encryption AAD, and conflict refetch behavior.
- `sync-encryption`: document that active-DEK changes through key-ring updates act as a sync write barrier for subsequent encrypted sync uploads.

## Impact

- Worker D1 schema/migrations for `key_ring.revision`.
- Worker E2EE routes and request parsing for `PUT /api/e2ee/key-ring`.
- Client key-ring record schemas, API wrapper, crypto AAD/decryption validation, IndexedDB cache refresh behavior, and tests.
- Existing atomic D1 assertion helper remains the rollback mechanism for stale key-ring update batches.

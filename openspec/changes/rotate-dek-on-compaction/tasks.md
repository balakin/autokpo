## 1. Data Model and Wire Format

- [ ] 1.1 Add `keyRingRevision` to sync request/response types, schemas, and client wire-format helpers.
- [ ] 1.2 Add `keyRingRevision` to the sync record D1 schema and generate/apply the migration for the new column.
- [ ] 1.3 Update sync row serialization so pull responses include `keyRingRevision` for updates and snapshots.
- [ ] 1.4 Add backend validation for decoded key-ring ciphertext size on setup and update requests.

## 2. Cryptography and Key-Ring Runtime

- [ ] 2.1 Update sync AAD construction to include `keyRingRevision` and adjust all encrypt/decrypt callers.
- [ ] 2.2 Change key-ring decrypt/unlock results to retain the decrypted DEK map in memory for the unlocked session.
- [ ] 2.3 Extend the encryption context with current key-ring revision and DEK lookup by id while preserving active DEK access for writes.
- [ ] 2.4 Add key-ring rotation helper logic that creates a new DEK, preserves existing DEKs, increments revision, and submits the revision-guarded update.

## 3. Server Write Barriers

- [ ] 3.1 Require push requests to include `keyRingRevision` and reject writes unless both DEK id and revision match the stored key ring at write time.
- [ ] 3.2 Require compact requests to include `keyRingRevision` and reject compactions unless both DEK id and revision match the stored key ring at write time.
- [ ] 3.3 Persist accepted `keyRingRevision` values on inserted update and snapshot rows.
- [ ] 3.4 Preserve existing idempotency behavior for duplicate push and compact ids with matching encryption metadata and ciphertext.

## 4. Client Pull and Conflict Recovery

- [ ] 4.1 Decrypt pulled rows by looking up each row's `encryptionKeyId` instead of always using the active DEK.
- [ ] 4.2 Refetch the key-ring profile once before decrypting rows whose `keyRingRevision` is newer than the local unlocked revision.
- [ ] 4.3 Treat decrypt failures for rows at or below the local key-ring revision as hard errors without repeated key-ring refetch loops.
- [ ] 4.4 Handle stale sync write conflicts silently by refreshing the key ring, pulling sync state, preserving the Y.Doc, recomputing pending data, and retrying with current key material.

## 5. Compaction Session Flow

- [ ] 5.1 Determine compact basis metadata, including `replacesUpTo` and max key-ring revision represented by covered rows.
- [ ] 5.2 Rotate or join a newer key-ring revision before compact preparation when the current revision is not newer than the compact basis.
- [ ] 5.3 Freeze compact request payload after rotation, including id, IV, ciphertext, `replacesUpTo`, `encryptionKeyId`, and `keyRingRevision`.
- [ ] 5.4 Retry transient compact failures with the exact same prepared request while the prepared revision remains current.
- [ ] 5.5 End stale compact sessions on write conflict or stale cursor/gap behavior, then refresh state and start a new compact session only if still needed.

## 6. Tests and Verification

- [ ] 6.1 Add crypto tests for revision-bound sync AAD and multi-DEK lookup behavior.
- [ ] 6.2 Add worker tests for `keyRingRevision` schema validation, write barriers, persistence, pull serialization, and key-ring ciphertext size limits.
- [ ] 6.3 Add sync engine tests for rotation-before-compaction, idempotent compact retry with the same prepared payload, and no repeated rotation during retry.
- [ ] 6.4 Add stale client tests for write-conflict recovery, one-time key-ring refetch on future row revision, and hard errors for current-or-older decrypt failures.
- [ ] 6.5 Run scoped Vitest suites for E2EE, sync logic, sync engine, local persistence, and worker sync/e2ee routes.

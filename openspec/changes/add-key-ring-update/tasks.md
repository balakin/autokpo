## 1. Schema and contract

- [ ] 1.1 Add `revision` to the key-ring database schema with initial value `1` for newly created rows.
- [ ] 1.2 Generate and review the D1 migration for the key-ring revision column.
- [ ] 1.3 Extend serialized key-ring profile schemas/types to include `keyRing.revision`.
- [ ] 1.4 Add a key-ring update request schema/type with `currentRevision`, `activeDekId`, supported encryption metadata, IV, and ciphertext.

## 2. Crypto and local validation

- [ ] 2.1 Include `revision: 1` in newly created encrypted key-ring plaintext.
- [ ] 2.2 Change key-ring AAD to `autokpo:e2ee-key-ring:v1:{userId}:{activeDekId}:{revision}` for encryption and decryption.
- [ ] 2.3 Validate decrypted plaintext `revision` and `activeDekId` against serialized key-ring metadata before exposing key material.
- [ ] 2.4 Add crypto tests for revision-bound AAD and plaintext metadata mismatch failures.

## 3. Backend key-ring update

- [ ] 3.1 Add `PUT /api/e2ee/key-ring` request parsing and validation.
- [ ] 3.2 Implement the conditional key-ring update and postcondition assertion in one D1 batch.
- [ ] 3.3 Return the updated serialized key-ring profile after successful update.
- [ ] 3.4 Return `409 { "code": "key_ring_revision_conflict" }` on stale revision and preserve rollback semantics.
- [ ] 3.5 Add worker route tests for successful update, stale revision conflict, validation failures, and rollback/no partial mutation.

## 4. Client API and cache behavior

- [ ] 4.1 Add a client API wrapper for `PUT /api/e2ee/key-ring` and map `key_ring_revision_conflict` to the key-ring conflict path.
- [ ] 4.2 On successful key-ring update, replace the encrypted IndexedDB key-ring and wrapper cache with the returned profile.
- [ ] 4.3 On revision conflict, refetch the latest key-ring profile, update the encrypted local cache, and do not automatically retry the rejected mutation.
- [ ] 4.4 Add client API/cache tests for success and revision conflict refetch behavior.

## 5. Sync barrier coverage and verification

- [ ] 5.1 Ensure existing sync push/compact active-DEK guards continue to reject writes whose `encryptionKeyId` differs from updated `key_ring.activeDekId`.
- [ ] 5.2 Add or update sync tests documenting that an active-DEK change acts as a write barrier for later old-DEK uploads.
- [ ] 5.3 Run targeted E2EE/sync tests and the app test suite.

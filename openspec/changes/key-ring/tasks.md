## 1. Schema and server contracts

- [ ] 1.1 Replace E2EE DB schema tables with singular `key_ring` and `key_ring_wrapping` models, including `iv`, `wrapping_iv`, `method`, `status`, `revoked_at`, and generated timestamp fields
- [ ] 1.2 Update the initial migration to remove `user_encryption_key` / `user_encryption_key_wrapping`, create `key_ring` / `key_ring_wrapping`, add the partial unique index for one active wrapper per user+method, and make `sync_record.encryption_key_id` a plain string column with no key FK
- [ ] 1.3 Update schema exports, row types, serializers, and validation helpers to use key-ring, wrapper, MEK, and DEK naming
- [ ] 1.4 Update account deletion cascade coverage so deleting a user removes key ring, key-ring wrappers, and sync records

## 2. Worker E2EE API

- [ ] 2.1 Replace `/api/e2ee/key` with `/api/e2ee/key-ring` route handlers and request/response schemas
- [ ] 2.2 Implement `POST /api/e2ee/key-ring` to create one key ring plus initial active password wrapper, preserve the frontend-provided wrapper id, validate wrapper id format/uniqueness, and return conflict when a key ring already exists
- [ ] 2.3 Implement `GET /api/e2ee/key-ring` to return the user's key ring plus only active wrappers, at most one wrapper per method, including wrapper id but excluding status and revoked metadata
- [ ] 2.4 Update worker E2EE API tests for create, get, duplicate conflict, wrapper id preservation, active-wrapper filtering, and validation failures

## 3. Worker sync validation

- [ ] 3.1 Update sync push/compact validation to load the authenticated user's key ring and reject requests whose `encryptionKeyId` does not equal `key_ring.active_dek_id`
- [ ] 3.2 Update sync tests and fixtures to create key-ring records instead of user encryption key records
- [ ] 3.3 Update sync pull/response tests to treat `encryptionKeyId` as a plain DEK id string, not a foreign key

## 4. Client crypto and key-ring records

- [ ] 4.1 Replace master-key record types with encrypted key-ring profile types, including `keyRing`, active wrappers, frontend-generated wrapper id, `activeDekId`, `iv`, and `wrappingIv`
- [ ] 4.2 Update crypto helpers so setup generates MEK + DEK, encrypts plaintext key ring with MEK using AAD `autokpo:e2ee-key-ring:v1:{userId}:{activeDekId}`, and wraps MEK with KEK using AAD `autokpo:e2ee-wrapped-mek:v1:{userId}:{wrapperId}:{method}`
- [ ] 4.3 Update unlock helpers to derive KEK, unwrap MEK, decrypt key ring, and return active DEK + active DEK id for the current session
- [ ] 4.4 Update crypto tests for wrapped-MEK AAD, key-ring AAD, wrong password failure, tampered metadata failure, and one-DEK plaintext key-ring validation

## 5. Client API, cache, and gate

- [ ] 5.1 Update the E2EE API client to call `/api/e2ee/key-ring` and parse the new key-ring profile response
- [ ] 5.2 Replace local key cache with encrypted key-ring profile cache in localStorage; store only encrypted key ring and active wrapper metadata/ciphertext
- [ ] 5.3 Update the gate/reducer/session flow to fetch backend first, fallback to encrypted cache only for offline/network-unavailable failures, and continue requiring the password every app session
- [ ] 5.4 Update setup flow to create and upload encrypted key ring + password wrapper, then unlock the current session with active DEK
- [ ] 5.5 Update unlock flow to decrypt the key ring and expose active DEK without changing user-facing copy unnecessarily
- [ ] 5.6 Update gate/cache/API tests for backend-first fetch, offline cache fallback, no fallback on non-network errors, setup, unlock, incorrect password, and user switching

## 6. Runtime encryption naming and sync client integration

- [ ] 6.1 Rename internal encryption context fields from `{ masterKey, keyId }` to active DEK terminology and update consumers
- [ ] 6.2 Update CRDT runtime, IndexedDB encrypted persistence, and sync engine code to use active DEK and active DEK id while preserving sync wire field `encryptionKeyId`
- [ ] 6.3 Keep sync record AAD shape `autokpo:e2ee-update:v1:{userId}:{encryptionKeyId}:{kind}` and update tests to treat the key id as a DEK id
- [ ] 6.4 Update all affected client tests for renamed context fields and active-DEK behavior

## 7. Specs, cleanup, and verification

- [ ] 7.1 Remove or replace remaining internal references to master-key storage, old table names, old route path, and old wrapper field `wrapIv`
- [ ] 7.2 Update OpenSpec base specs after implementation or during archive so `e2ee-key-ring`, `sync-encryption`, and `encryption-unlock-ui` reflect the new model
- [ ] 7.3 Run targeted worker E2EE and sync tests with verbose Vitest reporter
- [ ] 7.4 Run targeted client E2EE/CRDT tests with verbose Vitest reporter
- [ ] 7.5 Run package build/typecheck and fix regressions

## 1. Local persistence key and schema

- [x] 1.1 Initialize encrypted local persistence IndexedDB version 1 with a `local_key` object store for the singleton active local key record.
- [x] 1.2 Add local key record parsing/validation for `id: "active"`, `schemaVersion`, `localDekId`, wrapping metadata, wrapped DEK bytes, and `createdAt`.
- [x] 1.3 Add local DEK generation, MEK wrapping, and MEK unwrapping helpers for the local persistence key.
- [x] 1.4 Update encrypted update envelope parsing to require `kind`, generated `id`, `encryptionKeyId`, IV, ciphertext, and supported schema/encryption versions.
- [x] 1.5 Update local AES-GCM AAD construction to include database name, `updates` store name, envelope kind, envelope id, and local key id.

## 2. Explicit persistence API

- [x] 2.1 Refactor `EncryptedIndexeddbPersistence` so it no longer subscribes directly to `ydoc.on('update')`.
- [x] 2.2 Add explicit methods for loading cached updates, persisting one local update, persisting pulled remote updates, compacting with local key rotation, and clearing/reinitializing broken local persistence.
- [x] 2.3 Ensure load reads the active local key and update rows consistently, unwraps the local key with the MEK, validates every row key id, decrypts rows, and applies them with a non-persisting origin.
- [x] 2.4 Update CRDT runtime creation to pass the MEK or local-key wrapping capability to encrypted local persistence while keeping the remote sync DEK for sync encryption.

## 3. Web Lock serialization

- [x] 3.1 Add a user/database-scoped local persistence Web Lock helper.
- [x] 3.2 Wrap local update persistence, remote pulled update persistence, compaction/rotation, and broken-cache reset in the local persistence lock.
- [x] 3.3 Ensure append operations refresh or validate the active local key state while holding the lock before writing encrypted rows.
- [x] 3.4 Define unavailable Web Locks/error behavior so local persistence failure routes to cache recovery or a safe unavailable state.

## 4. Sync and cross-tab ordering

- [x] 4.1 Update the Y.Doc local update handler to persist local update bytes explicitly before marking dirty, broadcasting, and scheduling leader push.
- [x] 4.2 Update BroadcastChannel handlers so received local/remote updates apply in memory only and do not trigger local persistence or dirty/broadcast side effects.
- [x] 4.3 Update remote pull handling so the leader decrypts pulled records, persists plaintext updates locally, then applies/broadcasts them, and only then advances the sync cursor.
- [x] 4.4 Ensure crash-after-persist-before-cursor behavior remains safe by allowing duplicate remote Yjs updates to replay.

## 5. Compaction and recovery

- [x] 5.1 Implement compaction preparation under the local persistence lock: read rows, decrypt with current local DEK, encode snapshot, generate/wrap a new local DEK, and encrypt the snapshot with the new key.
- [x] 5.2 Commit compaction in one IndexedDB readwrite transaction over `local_key` and `updates`, replacing the active local key and covered update rows atomically.
- [x] 5.3 Treat missing/invalid local key records, unsupported envelopes, key-id mismatches, unwrap failures, and decrypt failures as broken local persistence.
- [x] 5.4 On broken local persistence, delete the local persistence database if possible, create fresh local key material, reset sync cursor state as needed, and force remote refetch.

## 6. Tests and verification

- [x] 6.1 Add unit tests for local key bootstrap, MEK wrapping/unwrapping, envelope AAD binding with `id` and `kind`, and wrong-key/wrong-id rejection.
- [x] 6.2 Add persistence tests proving local updates are written once and BroadcastChannel-applied updates are not redundantly persisted.
- [x] 6.3 Add sync-engine tests proving pulled remote records are persisted before cursor advancement and duplicate replay after a crash window is safe.
- [x] 6.4 Add compaction tests proving local key rotation atomically replaces the active key and update rows, and rehydration matches the compacted document.
- [x] 6.5 Add recovery tests for invalid key records, key-id mismatches, unwrap failure, decrypt failure, and reset/refetch triggering.
- [x] 6.6 Run targeted Vitest coverage for CRDT and E2EE persistence, then run the app test suite with the verbose reporter.

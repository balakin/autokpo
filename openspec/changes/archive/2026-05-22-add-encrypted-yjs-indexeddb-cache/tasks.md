## 1. Discovery and API Wiring

- [x] 1.1 Confirm the app only uses the existing IndexedDB persistence constructor/readiness/destroy/clear surface and does not depend on `get`, `set`, or `del` custom storage APIs.
- [x] 1.2 Update the CRDT runtime factory so it can receive the unlocked `masterKey` and `keyId` when constructing local persistence.
- [x] 1.3 Replace the `y-indexeddb` connector at the current Y.Doc persistence creation point with the new encrypted connector API.

## 2. Encrypted Persistence Core

- [x] 2.1 Add `EncryptedIndexeddbPersistence` with `whenSynced`, update-event wiring, `destroy()`, and `clearData()` behavior matching the used `y-indexeddb` lifecycle.
- [x] 2.2 Add IndexedDB storage setup for the existing database name and an auto-increment `updates` object store.
- [x] 2.3 Add AES-GCM envelope encryption/decryption for update rows with `schemaVersion: 1`, `encryptionAlgorithm: "aes-256-gcm"`, `encryptionVersion: 1`, `encryptionKeyId`, random 12-byte `iv`, and `ciphertext`.
- [x] 2.4 Use AAD `autokpo:yjs-indexeddb:v1:<dbName>:updates:<keyId>` for every cache encrypt/decrypt operation.
- [x] 2.5 Load encrypted updates in key order during startup, decrypt them, and apply them to the Y.Doc with origin set to the persistence instance.
- [x] 2.6 Persist every later Y.Doc update whose origin is not the persistence instance, including remote sync updates.

## 3. Cache Failure and Compaction Behavior

- [x] 3.1 Treat IndexedDB open/read/parse/decrypt/unsupported-envelope failures as cache misses, delete the database when possible, and continue with an empty local cache.
- [x] 3.2 Compact the update log after 500 stored updates by appending an encrypted full Yjs snapshot and deleting older covered rows.
- [x] 3.3 Ensure startup readiness resolves after successful encrypted hydration or after cache-miss fallback so existing bootstrap/render ordering is preserved.

## 4. Dependency Cleanup

- [x] 4.1 Remove the `y-indexeddb` import and dependency after the encrypted connector is wired.
- [x] 4.2 Remove or replace the existing `y-indexeddb` test mock with encrypted persistence test support.

## 5. Tests and Verification

- [x] 5.1 Add unit tests proving encrypted cache writes do not store plaintext Yjs update bytes and include the expected envelope metadata.
- [x] 5.2 Add tests for startup rehydration from encrypted IndexedDB into a fresh Y.Doc.
- [x] 5.3 Add tests for wrong key/AAD, unsupported envelope metadata, and storage errors falling back to an empty cache without applying bytes.
- [x] 5.4 Add tests for origin filtering: provider replay updates are not re-persisted, while local edits and remote sync updates are persisted.
- [x] 5.5 Add tests for 500-update compaction and rehydration after compaction.
- [x] 5.6 Run the relevant app test suite with Vitest verbose reporter and run the app build/typecheck.

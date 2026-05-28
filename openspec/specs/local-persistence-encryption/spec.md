# local-persistence-encryption Specification

## Purpose

TBD - created by archiving change secure-local-persistence. Update Purpose after archive.

## Requirements

### Requirement: Dedicated local persistence DEK

The local key record stored in the `local_key` object store SHALL contain `id: "active"`, `schemaVersion: 1`, `localDekId`, `wrappingAlgorithm: "aes-256-gcm"`, `wrappingParams` (containing `iv` and `tagBits`), `wrappedDek`, and `createdAt`. It SHALL NOT contain a standalone `wrappingIv` or `wrappingVersion` field.

#### Scenario: Local key record uses wrappingParams

- **WHEN** the encrypted local persistence database stores the wrapped local DEK
- **THEN** the local key record SHALL contain `wrappingParams: { iv: <Uint8Array>, tagBits: 128 }`
- **AND** SHALL NOT contain a standalone `wrappingIv` field
- **AND** SHALL NOT contain a `wrappingVersion` field

### Requirement: Local encrypted rows are bound to row identity

The system SHALL store each local encrypted Yjs update or snapshot as an AES-256-GCM envelope containing `schemaVersion: 1`, `kind`, `id`, `encryptionAlgorithm: "aes-256-gcm"`, `encryptionKeyId`, `encryptionParams` (containing `iv` and `tagBits`), and `ciphertext`. The `id` SHALL be generated before encryption and SHALL be included in AES-GCM AAD together with the database name, store name, row kind, and local key id.

#### Scenario: Update row includes generated id and params

- **WHEN** the system persists a local Yjs update row
- **THEN** it SHALL generate an `id` for that row before encryption
- **AND** SHALL store the same `id` in the encrypted envelope
- **AND** SHALL store `encryptionParams: { iv: <base64>, tagBits: 128 }` inside the envelope
- **AND** SHALL NOT store a standalone `iv` or `encryptionVersion` field at the envelope root
- **AND** SHALL include the `id` in the AES-GCM AAD used to encrypt the row

#### Scenario: Row id substitution fails authentication

- **WHEN** a ciphertext encrypted for local row id `a` is parsed or decrypted as local row id `b`
- **THEN** AES-GCM authentication SHALL fail
- **AND** the system SHALL treat the local persistence database as broken

### Requirement: Local persistence mutations are serialized

The system SHALL serialize all local encrypted persistence mutations with an exclusive Web Lock scoped to the authenticated user and local persistence database. The lock SHALL cover local update persistence, remote pulled update persistence, local compaction, local key rotation, and local persistence reset/reinitialization.

#### Scenario: Local append waits for compaction

- **WHEN** one tab is compacting and rotating the local persistence database under the local persistence lock
- **AND** another tab needs to persist a local Yjs update
- **THEN** the append SHALL wait until the compaction lock holder finishes
- **AND** SHALL persist using the active local key after the lock is acquired

#### Scenario: Remote persistence waits for local append

- **WHEN** a tab is appending a local update under the local persistence lock
- **AND** the sync leader needs to persist pulled remote records
- **THEN** the remote persistence operation SHALL wait for the same lock before writing encrypted local rows

### Requirement: Remote cursor advances after local durability

The sync leader SHALL persist decrypted remote pull records to encrypted local IndexedDB persistence before advancing the local sync cursor for those records. Cursor advancement SHALL happen only after the corresponding remote update bytes have been successfully written to local persistence or after the local database has been reset for recovery.

#### Scenario: Remote records persist before cursor update

- **WHEN** the sync leader pulls remote records with server head `h`
- **THEN** it SHALL decrypt the records
- **AND** SHALL persist their plaintext Yjs update bytes to encrypted local IndexedDB persistence
- **AND** only after that persistence succeeds SHALL it write sync state with cursor at or beyond `h`

#### Scenario: Crash after persistence before cursor write replays safely

- **WHEN** pulled remote records are persisted locally but the app closes before the sync cursor is advanced
- **THEN** the next sync SHALL be allowed to pull the same records again
- **AND** applying the duplicate Yjs updates SHALL preserve the document state

### Requirement: Compaction rotates the local persistence key atomically

The system SHALL rotate the local persistence DEK during local IndexedDB compaction. The final compaction commit SHALL use one IndexedDB readwrite transaction covering both the active local key store and the update store, replacing the active local key and replacing the covered update rows with a compact snapshot encrypted by the new local key.

#### Scenario: Compaction swaps key and rows together

- **WHEN** the encrypted local update log reaches the compaction threshold
- **THEN** the system SHALL build a full Yjs snapshot from the currently persisted rows
- **AND** SHALL generate and MEK-wrap a new local persistence DEK
- **AND** SHALL encrypt the snapshot with the new local persistence DEK
- **AND** SHALL commit the new active key, delete covered old rows, and add the new encrypted snapshot in one IndexedDB transaction

#### Scenario: Crash during compaction leaves consistent key state

- **WHEN** the app closes before or during the final IndexedDB compaction transaction
- **THEN** the committed database state SHALL contain either the old active key with old rows or the new active key with the compacted snapshot
- **AND** the committed rows SHALL be decryptable by the committed active local key

### Requirement: Broken local persistence resets and refetches

The system SHALL treat invalid local persistence key records, unsupported envelope schemas, active-key mismatches, unwrap failures, and decrypt failures as a broken local cache. When the local cache is broken, the system SHALL delete the local persistence database if possible, create a fresh local persistence DEK, reset local sync cursor state as needed, and force remote refetch.

#### Scenario: Local row key mismatch triggers recovery

- **WHEN** a local encrypted update row has an `encryptionKeyId` that does not match the active local key id
- **THEN** the system SHALL NOT apply that row to the Y.Doc
- **AND** SHALL clear and reinitialize local persistence
- **AND** SHALL force remote sync to refetch state

#### Scenario: Local key unwrap failure triggers recovery

- **WHEN** the active local key record cannot be unwrapped with the unlocked MEK
- **THEN** the system SHALL treat local persistence as broken
- **AND** SHALL clear and reinitialize local persistence
- **AND** SHALL force remote sync to refetch state

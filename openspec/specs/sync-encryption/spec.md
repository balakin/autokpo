## Purpose

Define end-to-end encryption for CRDT sync payloads before upload and after download.

## Requirements

### Requirement: Sync blobs are encrypted before upload

The sync engine SHALL encrypt every Yjs delta and snapshot blob using AES-256-GCM with a random 12-byte IV before sending it to the server. The `ciphertext` field in the request body SHALL contain only the raw ciphertext (base64-encoded). The algorithm, IV, and encryption version SHALL be sent as separate JSON fields `encryptionAlgorithm`, `iv` (base64), and `encryptionVersion` (integer). The plaintext SHALL never leave the browser.

#### Scenario: Push encrypts delta before upload

- **WHEN** the sync engine prepares a push
- **THEN** it SHALL generate a random 12-byte IV
- **AND** encrypt the Yjs delta bytes using AES-256-GCM with the active DEK from the unlocked key ring
- **AND** send the request body `{ id, encryptionKeyId, encryptionAlgorithm: "aes-256-gcm", encryptionVersion: 1, iv: <base64>, ciphertext: <base64 ciphertext> }`
- **AND** `encryptionKeyId` SHALL equal the active DEK id

#### Scenario: Compact encrypts snapshot before upload

- **WHEN** the sync engine prepares a compact
- **THEN** it SHALL encrypt the full Yjs snapshot using the same split-envelope format
- **AND** send `{ id, encryptionKeyId, encryptionAlgorithm: "aes-256-gcm", encryptionVersion: 1, iv: <base64>, ciphertext: <base64 ciphertext> }` in the compact request body
- **AND** `encryptionKeyId` SHALL equal the active DEK id

### Requirement: Received sync blobs are decrypted before application

The sync engine SHALL decrypt every received record before applying it to the Y.Doc. Each pull response record SHALL include `id`, `encryptionKeyId`, `encryptionAlgorithm`, `encryptionVersion`, `iv` (base64), and `ciphertext` (base64 ciphertext) as separate fields; the client SHALL base64-decode `iv` and `ciphertext`, then decrypt using AES-256-GCM and the DEK identified by `encryptionKeyId`.

#### Scenario: Pull decrypts records before applying to Y.Doc

- **WHEN** the sync engine receives records from a pull response
- **THEN** for each record it SHALL read `id`, `encryptionKeyId`, `encryptionAlgorithm`, and `encryptionVersion`, decode `iv` and `ciphertext` from base64
- **AND** decrypt the ciphertext using AES-256-GCM with the IV and the active DEK
- **AND** pass the resulting plaintext bytes to `applyRecordsToDoc`

#### Scenario: Decryption failure aborts application

- **WHEN** decryption of a received blob fails (wrong key, tampered ciphertext, bad AAD)
- **THEN** the system SHALL NOT apply any bytes from that record to the Y.Doc
- **AND** SHALL surface the error to the sync engine error path

### Requirement: AAD binds ciphertext to its metadata

Every AES-256-GCM operation SHALL use additional authenticated data (AAD) constructed as the UTF-8 encoding of `"autokpo:e2ee-update:v1:{userId}:{keyId}:{blockId}:{kind}"`, where `keyId` is the DEK id from `encryptionKeyId`, `blockId` is the sync record `id`, and `kind` is `"update"` or `"snapshot"`.

#### Scenario: AAD prevents cross-user blob transfer

- **WHEN** a ciphertext encrypted with AAD containing `userId=u1` is decrypted with AAD containing `userId=u2`
- **THEN** AES-GCM authentication SHALL fail and decryption SHALL be rejected

#### Scenario: AAD prevents update/snapshot kind confusion

- **WHEN** a ciphertext encrypted with `kind=update` is decrypted with `kind=snapshot`
- **THEN** AES-GCM authentication SHALL fail and decryption SHALL be rejected

#### Scenario: AAD prevents sync block id substitution

- **WHEN** a ciphertext encrypted with AAD containing `blockId=b1` is decrypted with AAD containing `blockId=b2`
- **THEN** AES-GCM authentication SHALL fail and decryption SHALL be rejected

### Requirement: Encryption key id is sent with every upload

Every push and compact request body SHALL include the `encryptionKeyId` field identifying which DEK was used to encrypt the blob. The server SHALL reject writes where `encryptionKeyId` does not match the authenticated user's key-ring `activeDekId`, and this active-key precondition SHALL be enforced at write time so a concurrent key change cannot race a later sync row insert.

#### Scenario: Push body includes active DEK id

- **WHEN** the sync engine sends a push request
- **THEN** the JSON body SHALL include `encryptionKeyId` matching the active DEK id from the unlocked key ring
- **AND** the server SHALL reject the push if `encryptionKeyId` does not match the authenticated user's stored `activeDekId`
- **AND** the server SHALL enforce the active-DEK check in the database write path rather than relying only on an earlier read

#### Scenario: Compact body includes active DEK id

- **WHEN** the sync engine sends a compact request
- **THEN** the JSON body SHALL include `encryptionKeyId` matching the active DEK id from the unlocked key ring
- **AND** the server SHALL reject the compact request if `encryptionKeyId` does not match the authenticated user's stored `activeDekId`
- **AND** the server SHALL enforce the active-DEK check in the database write path rather than relying only on an earlier read

### Requirement: Encryption context provides key material to the sync engine

The system SHALL expose a React context that provides the active DEK and active DEK id to its subtree after the encryption session is unlocked. `useSyncEngine` SHALL read this context to obtain the key material needed for encrypt and decrypt operations.

#### Scenario: Sync engine reads key material from context

- **WHEN** `useSyncEngine` prepares a push or compact
- **THEN** it SHALL read the active DEK and active DEK id from `EncryptionContext`
- **AND** use them to encrypt the blob and populate `encryptionKeyId` in the request body

#### Scenario: Sync engine reads key material for decryption

- **WHEN** `useSyncEngine` processes records from a pull response
- **THEN** it SHALL read the active DEK from `EncryptionContext` to decrypt each blob

### Requirement: Sync push writes are atomic and idempotent

The backend SHALL persist sync push rows with database-guarded atomic behavior that preserves the existing idempotency contract.

#### Scenario: Push insert uses current active key

- **WHEN** an authenticated client pushes an encrypted update with a new sync record id
- **THEN** the backend SHALL insert the sync record only if the submitted `encryptionKeyId` is still the authenticated user's active DEK at write time
- **AND** the backend SHALL rollback the push write if the active-key precondition fails during the batch

#### Scenario: Duplicate push id keeps idempotency behavior

- **WHEN** an authenticated client pushes with a sync record id that already exists for that user
- **AND** the submitted encryption metadata and ciphertext match the existing row
- **THEN** the backend SHALL treat the request as idempotent success
- **AND** the backend SHALL reject the request as an idempotency conflict when the existing row differs

### Requirement: Sync compact writes are atomic

The backend SHALL persist sync compaction mutations atomically so snapshot insertion and covered-row cleanup cannot partially persist on conflict or storage failure.

#### Scenario: Compact inserts snapshot and deletes covered rows atomically

- **WHEN** an authenticated client submits a valid compact request
- **THEN** the backend SHALL insert the compact snapshot and delete the covered sync rows in one D1 batch
- **AND** the backend SHALL rollback the entire compact mutation if any required compact precondition or write fails

#### Scenario: Compact conflict preserves previous sync rows

- **WHEN** a compact request fails because its head, idempotency, storage, or active-key precondition is stale or invalid
- **THEN** the backend SHALL NOT leave a compact snapshot without the corresponding cleanup
- **AND** the backend SHALL NOT delete covered rows without a committed compact snapshot

### Requirement: Active DEK updates act as sync write barriers

The server SHALL treat the stored key-ring `activeDekId` as the write-time authority for encrypted sync uploads. After a key-ring update changes `activeDekId`, sync push and compact requests encrypted with a previous active DEK SHALL be rejected by the existing active-key precondition.

#### Scenario: Previous active DEK cannot write after key-ring update

- **WHEN** a key-ring update changes the authenticated user's stored `activeDekId`
- **AND** a later sync push or compact request submits `encryptionKeyId` equal to the previous active DEK id
- **THEN** the backend SHALL reject the sync write using the existing active-key mismatch behavior
- **AND** the backend SHALL NOT persist a sync row encrypted with the previous active DEK after the key-ring update commits

#### Scenario: Old DEKs remain readable until compacted away

- **WHEN** sync records encrypted with a previous DEK still exist
- **AND** the key-ring active DEK changes to a new DEK
- **THEN** clients SHALL be able to decrypt existing records by looking up each record's `encryptionKeyId` in the unlocked key-ring DEK map
- **AND** key-ring update SHALL NOT require sync compaction to succeed in the same request

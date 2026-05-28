## MODIFIED Requirements

### Requirement: Sync blobs are encrypted before upload

The sync engine SHALL encrypt every Yjs delta and snapshot blob using AES-256-GCM with a random 12-byte IV before sending it to the server. The `ciphertext` field in the request body SHALL contain only the raw ciphertext (base64-encoded). The algorithm, IV, encryption version, key-ring revision, and DEK id SHALL be sent as separate JSON fields `encryptionAlgorithm`, `iv` (base64), `encryptionVersion` (integer), `keyRingRevision` (integer), and `encryptionKeyId` (string). The plaintext SHALL never leave the browser.

#### Scenario: Push encrypts delta before upload

- **WHEN** the sync engine prepares a push
- **THEN** it SHALL generate a random 12-byte IV
- **AND** encrypt the Yjs delta bytes using AES-256-GCM with the active DEK from the unlocked key ring
- **AND** send the request body `{ id, encryptionKeyId, keyRingRevision, encryptionAlgorithm: "aes-256-gcm", encryptionVersion: 1, iv: <base64>, ciphertext: <base64 ciphertext> }`
- **AND** `encryptionKeyId` SHALL equal the active DEK id
- **AND** `keyRingRevision` SHALL equal the current unlocked key-ring revision

#### Scenario: Compact encrypts snapshot before upload

- **WHEN** the sync engine prepares a compact
- **THEN** it SHALL encrypt the full Yjs snapshot using the same split-envelope format
- **AND** send `{ id, encryptionKeyId, keyRingRevision, encryptionAlgorithm: "aes-256-gcm", encryptionVersion: 1, iv: <base64>, ciphertext: <base64 ciphertext> }` in the compact request body
- **AND** `encryptionKeyId` SHALL equal the active DEK id selected for the compact session
- **AND** `keyRingRevision` SHALL equal the key-ring revision selected for the compact session

### Requirement: Received sync blobs are decrypted before application

The sync engine SHALL decrypt every received record before applying it to the Y.Doc. Each pull response record SHALL include `id`, `encryptionKeyId`, `keyRingRevision`, `encryptionAlgorithm`, `encryptionVersion`, `iv` (base64), and `ciphertext` (base64 ciphertext) as separate fields; the client SHALL base64-decode `iv` and `ciphertext`, then decrypt using AES-256-GCM and the DEK identified by `encryptionKeyId`.

#### Scenario: Pull decrypts records before applying to Y.Doc

- **WHEN** the sync engine receives records from a pull response
- **THEN** for each record it SHALL read `id`, `encryptionKeyId`, `keyRingRevision`, `encryptionAlgorithm`, and `encryptionVersion`, decode `iv` and `ciphertext` from base64
- **AND** decrypt the ciphertext using AES-256-GCM with the IV and the DEK identified by `encryptionKeyId` in the unlocked key ring
- **AND** pass the resulting plaintext bytes to `applyRecordsToDoc`

#### Scenario: Future key-ring revision triggers one profile refresh

- **WHEN** the sync engine receives a record whose `keyRingRevision` is greater than the local unlocked key-ring revision
- **THEN** the sync engine SHALL refetch the key-ring profile once
- **AND** retry decryption after the profile refresh
- **AND** SHALL surface an error if the refreshed key-ring revision is still less than the record revision

#### Scenario: Decryption failure aborts application

- **WHEN** decryption of a received blob fails after any required key-ring refresh (wrong key, missing DEK, tampered ciphertext, bad AAD)
- **THEN** the system SHALL NOT apply any bytes from that record to the Y.Doc
- **AND** SHALL surface the error to the sync engine error path
- **AND** SHALL NOT repeatedly refetch the key-ring profile when the record `keyRingRevision` is less than or equal to the local key-ring revision

### Requirement: AAD binds ciphertext to its metadata

Every AES-256-GCM operation SHALL use additional authenticated data (AAD) constructed as the UTF-8 encoding of `"autokpo:e2ee-update:v1:{userId}:{keyId}:{keyRingRevision}:{blockId}:{kind}"`, where `keyId` is the DEK id from `encryptionKeyId`, `keyRingRevision` is the key-ring revision submitted or returned with the sync row, `blockId` is the sync record `id`, and `kind` is `"update"` or `"snapshot"`.

#### Scenario: AAD prevents cross-user blob transfer

- **WHEN** a ciphertext encrypted with AAD containing `userId=u1` is decrypted with AAD containing `userId=u2`
- **THEN** AES-GCM authentication SHALL fail and decryption SHALL be rejected

#### Scenario: AAD prevents update/snapshot kind confusion

- **WHEN** a ciphertext encrypted with `kind=update` is decrypted with `kind=snapshot`
- **THEN** AES-GCM authentication SHALL fail and decryption SHALL be rejected

#### Scenario: AAD prevents sync block id substitution

- **WHEN** a ciphertext encrypted with AAD containing `blockId=b1` is decrypted with AAD containing `blockId=b2`
- **THEN** AES-GCM authentication SHALL fail and decryption SHALL be rejected

#### Scenario: AAD prevents key-ring revision substitution

- **WHEN** a ciphertext encrypted with AAD containing `keyRingRevision=2` is decrypted with AAD containing `keyRingRevision=3`
- **THEN** AES-GCM authentication SHALL fail and decryption SHALL be rejected

### Requirement: Encryption key id is sent with every upload

Every push and compact request body SHALL include the `encryptionKeyId` field identifying which DEK was used to encrypt the blob and the `keyRingRevision` field identifying which key-ring revision made that DEK active for the write. The server SHALL reject writes where `encryptionKeyId` does not match the authenticated user's key-ring `activeDekId` or where `keyRingRevision` does not match the authenticated user's key-ring `revision`, and these preconditions SHALL be enforced at write time so a concurrent key change cannot race a later sync row insert.

#### Scenario: Push body includes active DEK id and key-ring revision

- **WHEN** the sync engine sends a push request
- **THEN** the JSON body SHALL include `encryptionKeyId` matching the active DEK id from the unlocked key ring
- **AND** the JSON body SHALL include `keyRingRevision` matching the current unlocked key-ring revision
- **AND** the server SHALL reject the push if `encryptionKeyId` does not match the authenticated user's stored `activeDekId`
- **AND** the server SHALL reject the push if `keyRingRevision` does not match the authenticated user's stored key-ring `revision`
- **AND** the server SHALL enforce both checks in the database write path rather than relying only on an earlier read

#### Scenario: Compact body includes active DEK id and key-ring revision

- **WHEN** the sync engine sends a compact request
- **THEN** the JSON body SHALL include `encryptionKeyId` matching the DEK id selected for the compact session
- **AND** the JSON body SHALL include `keyRingRevision` matching the key-ring revision selected for the compact session
- **AND** the server SHALL reject the compact request if `encryptionKeyId` does not match the authenticated user's stored `activeDekId`
- **AND** the server SHALL reject the compact request if `keyRingRevision` does not match the authenticated user's stored key-ring `revision`
- **AND** the server SHALL enforce both checks in the database write path rather than relying only on an earlier read

### Requirement: Active DEK updates act as sync write barriers

The server SHALL treat the stored key-ring `activeDekId` and `revision` as the write-time authority for encrypted sync uploads. After a key-ring update changes `activeDekId` and increments `revision`, sync push and compact requests encrypted with a previous active DEK or carrying a previous key-ring revision SHALL be rejected by the existing write-conflict behavior.

#### Scenario: Previous active DEK cannot write after key-ring update

- **WHEN** a key-ring update changes the authenticated user's stored `activeDekId` and increments the key-ring `revision`
- **AND** a later sync push or compact request submits `encryptionKeyId` equal to the previous active DEK id or `keyRingRevision` equal to the previous key-ring revision
- **THEN** the backend SHALL reject the sync write using the existing active-key mismatch behavior
- **AND** the backend SHALL NOT persist a sync row encrypted with the previous active DEK after the key-ring update commits

#### Scenario: Old DEKs remain readable until compacted away

- **WHEN** sync records encrypted with a previous DEK still exist
- **AND** the key-ring active DEK changes to a new DEK
- **THEN** clients SHALL be able to decrypt existing records by looking up each record's `encryptionKeyId` in the unlocked key-ring DEK map
- **AND** key-ring update SHALL NOT require sync compaction to succeed in the same request

## ADDED Requirements

### Requirement: Sync rows store key-ring revision

The backend SHALL persist `keyRingRevision` on every sync row and SHALL return it in every pull response record. The stored revision SHALL be the key-ring revision accepted by the write-time key-ring revision precondition.

#### Scenario: Push stores key-ring revision

- **WHEN** the backend accepts a sync push request
- **THEN** the inserted sync update row SHALL store the submitted `keyRingRevision`
- **AND** that submitted revision SHALL match the authenticated user's stored key-ring revision at write time

#### Scenario: Compact stores key-ring revision

- **WHEN** the backend accepts a sync compact request
- **THEN** the inserted sync snapshot row SHALL store the submitted `keyRingRevision`
- **AND** that submitted revision SHALL match the authenticated user's stored key-ring revision at write time

#### Scenario: Pull returns key-ring revision

- **WHEN** the backend returns sync records from a pull request
- **THEN** each returned record SHALL include its stored `keyRingRevision`

### Requirement: Compact session rotates once and retries idempotently

The client SHALL treat server compact hints as the start of a compact session. A compact session SHALL ensure a target key-ring revision newer than the compact basis, prepare one compact request after rotation or joining a newer revision, and retry the exact same prepared request for transient failures while the prepared revision remains current.

#### Scenario: Compact hint starts rotation then compact preparation

- **WHEN** a sync push response includes a compact hint
- **THEN** the client SHALL determine the compact basis `replacesUpTo` and the maximum key-ring revision represented by covered rows
- **AND** the client SHALL rotate or join a newer key-ring revision before encoding and encrypting the compact snapshot when the current revision is not newer than that basis
- **AND** the client SHALL prepare the compact snapshot using the selected active DEK and key-ring revision

#### Scenario: Transient compact retry reuses prepared request

- **WHEN** a prepared compact request fails because of a transient network or retryable server error
- **AND** the prepared key-ring revision is still current locally
- **THEN** the client SHALL retry with the same compact id, IV, ciphertext, `replacesUpTo`, `encryptionKeyId`, and `keyRingRevision`
- **AND** the client SHALL NOT rotate the key ring again within that compact session

#### Scenario: Stale compact request ends session

- **WHEN** a prepared compact request fails because the server rejects the submitted key id or key-ring revision
- **THEN** the client SHALL end the compact session
- **AND** the client SHALL refetch key-ring state and sync state as needed
- **AND** the client SHALL start a new compact session only if compaction is still needed

### Requirement: Stale write-key conflicts recover silently

The client SHALL recover from sync write conflicts caused by stale key-ring state without user interaction. Recovery SHALL preserve the local Y.Doc, refresh the key-ring profile, pull sync data, recompute pending data, and retry using the current active DEK and key-ring revision.

#### Scenario: Stale push recovers with latest key ring

- **WHEN** a push encrypted with a stale DEK or stale key-ring revision is rejected with a write conflict
- **THEN** the client SHALL refetch the key-ring profile
- **AND** the client SHALL pull sync records using the refreshed key-ring material
- **AND** the client SHALL keep local Y.Doc contents intact
- **AND** the client SHALL recompute the pending delta and retry with the current active DEK and key-ring revision

#### Scenario: Stale compact recovers by starting a new session

- **WHEN** a compact request encrypted with a stale DEK or stale key-ring revision is rejected with a write conflict
- **THEN** the client SHALL end the current compact session
- **AND** the client SHALL refetch the key-ring profile and pull sync records
- **AND** the client SHALL start a new compact session only if the server still indicates compaction is needed

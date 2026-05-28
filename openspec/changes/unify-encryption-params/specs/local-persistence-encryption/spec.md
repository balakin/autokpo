## MODIFIED Requirements

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

### Requirement: Dedicated local persistence DEK wrapping record omits version fields

The local key record stored in the `local_key` object store SHALL contain `id: "active"`, `schemaVersion: 1`, `localDekId`, `wrappingAlgorithm: "aes-256-gcm"`, `wrappingParams` (containing `iv` and `tagBits`), `wrappedDek`, and `createdAt`. It SHALL NOT contain a standalone `wrappingIv` or `wrappingVersion` field.

#### Scenario: Local key record uses wrappingParams

- **WHEN** the encrypted local persistence database stores the wrapped local DEK
- **THEN** the local key record SHALL contain `wrappingParams: { iv: <Uint8Array>, tagBits: 128 }`
- **AND** SHALL NOT contain a standalone `wrappingIv` field
- **AND** SHALL NOT contain a `wrappingVersion` field

## REMOVED Requirements

### Requirement: encryptionVersion and standalone iv stored at envelope root

**Reason**: Version is redundant with algorithm string; iv belongs inside encryptionParams for consistency.
**Migration**: IDB database version bump with migration that reads old envelope shape (with `encryptionVersion` and top-level `iv`) and rewrites to new shape (with `encryptionParams: { iv, tagBits }`) on first open.

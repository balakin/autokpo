## MODIFIED Requirements

### Requirement: Sync blobs are encrypted before upload

The sync engine SHALL encrypt every Yjs delta and snapshot blob using AES-256-GCM with a random 12-byte IV before sending it to the server. The `ciphertext` field in the request body SHALL contain only the raw ciphertext (base64-encoded). The algorithm, encryption params (including IV), key-ring revision, and DEK id SHALL be sent as JSON fields. The plaintext SHALL never leave the browser.

#### Scenario: Push encrypts delta before upload

- **WHEN** the sync engine prepares a push
- **THEN** it SHALL generate a random 12-byte IV
- **AND** encrypt the Yjs delta bytes using AES-256-GCM with the active DEK from the unlocked key ring
- **AND** send the request body `{ id, encryptionKeyId, keyRingRevision, encryptionAlgorithm: "aes-256-gcm", encryptionParams: { iv: <base64>, tagBits: 128 }, ciphertext: <base64 ciphertext> }`
- **AND** `encryptionKeyId` SHALL equal the active DEK id
- **AND** `keyRingRevision` SHALL equal the current unlocked key-ring revision
- **AND** the body SHALL NOT contain a standalone `iv` field or an `encryptionVersion` field

#### Scenario: Compact encrypts snapshot before upload

- **WHEN** the sync engine prepares a compact
- **THEN** it SHALL encrypt the full Yjs snapshot using the same params-envelope format
- **AND** send `{ id, encryptionKeyId, keyRingRevision, encryptionAlgorithm: "aes-256-gcm", encryptionParams: { iv: <base64>, tagBits: 128 }, ciphertext: <base64 ciphertext> }` in the compact request body
- **AND** the body SHALL NOT contain a standalone `iv` field or an `encryptionVersion` field

### Requirement: Received sync blobs are decrypted before application

The sync engine SHALL decrypt every received record before applying it to the Y.Doc. Each pull response record SHALL include `id`, `encryptionKeyId`, `keyRingRevision`, `encryptionAlgorithm`, `encryptionParams` (containing `iv` and `tagBits`), and `ciphertext`; the client SHALL use `encryptionParams.iv` (base64-decoded) and `encryptionParams.tagBits` to decrypt using AES-256-GCM with the DEK identified by `encryptionKeyId`.

#### Scenario: Pull decrypts records before applying to Y.Doc

- **WHEN** the sync engine receives records from a pull response
- **THEN** for each record it SHALL read `id`, `encryptionKeyId`, `keyRingRevision`, `encryptionAlgorithm`, decode `encryptionParams.iv` and `ciphertext` from base64
- **AND** decrypt the ciphertext using AES-256-GCM with the IV and tagBits from `encryptionParams` and the DEK identified by `encryptionKeyId`
- **AND** pass the resulting plaintext bytes to `applyRecordsToDoc`
- **AND** the record SHALL NOT contain a standalone `iv` field or `encryptionVersion` field

## REMOVED Requirements

### Requirement: encryptionVersion is sent and received as a separate integer field

**Reason**: The algorithm string alone identifies the params shape. Standalone version integer is redundant.
**Migration**: Remove `encryptionVersion` from push, compact, and pull record shapes. Move `iv` into `encryptionParams` object alongside `tagBits`. Update server worker validation to match new wire format.

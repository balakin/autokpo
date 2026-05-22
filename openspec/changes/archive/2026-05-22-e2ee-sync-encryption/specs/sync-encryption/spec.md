## ADDED Requirements

### Requirement: Sync blobs are encrypted before upload

The sync engine SHALL encrypt every Yjs delta and snapshot blob using AES-256-GCM with a random 12-byte IV before sending it to the server. The `ciphertext` field in the request body SHALL contain only the raw ciphertext (base64-encoded). The algorithm, IV, and encryption version SHALL be sent as separate JSON fields `encryptionAlgorithm`, `iv` (base64), and `encryptionVersion` (integer). The plaintext SHALL never leave the browser.

#### Scenario: Push encrypts delta before upload

- **WHEN** the sync engine prepares a push
- **THEN** it SHALL generate a random 12-byte IV
- **AND** encrypt the Yjs delta bytes using AES-256-GCM with the session master key
- **AND** send the request body `{ id, encryptionKeyId, encryptionAlgorithm: "aes-256-gcm", encryptionVersion: 1, iv: <base64>, ciphertext: <base64 ciphertext> }`

#### Scenario: Compact encrypts snapshot before upload

- **WHEN** the sync engine prepares a compact
- **THEN** it SHALL encrypt the full Yjs snapshot using the same split-envelope format
- **AND** send `{ id, encryptionKeyId, encryptionAlgorithm: "aes-256-gcm", encryptionVersion: 1, iv: <base64>, ciphertext: <base64 ciphertext> }` in the compact request body

### Requirement: Received sync blobs are decrypted before application

The sync engine SHALL decrypt every received record before applying it to the Y.Doc. Each pull response record SHALL include `encryptionAlgorithm`, `encryptionVersion`, `iv` (base64), and `ciphertext` (base64 ciphertext) as separate fields; the client SHALL base64-decode `iv` and `ciphertext`, then decrypt using AES-256-GCM.

#### Scenario: Pull decrypts records before applying to Y.Doc

- **WHEN** the sync engine receives records from a pull response
- **THEN** for each record it SHALL read `encryptionAlgorithm` and `encryptionVersion`, decode `iv` and `ciphertext` from base64
- **AND** decrypt the ciphertext using AES-256-GCM with the IV and session master key
- **AND** pass the resulting plaintext bytes to `applyRecordsToDoc`

#### Scenario: Decryption failure aborts application

- **WHEN** decryption of a received blob fails (wrong key, tampered ciphertext, bad AAD)
- **THEN** the system SHALL NOT apply any bytes from that record to the Y.Doc
- **AND** SHALL surface the error to the sync engine error path

### Requirement: AAD binds ciphertext to its metadata

Every AES-256-GCM operation SHALL use additional authenticated data (AAD) constructed as the UTF-8 encoding of `"autokpo:e2ee-update:v1:{userId}:{keyId}:{kind}"`, where `kind` is `"update"` or `"snapshot"`.

#### Scenario: AAD prevents cross-user blob transfer

- **WHEN** a ciphertext encrypted with AAD containing `userId=u1` is decrypted with AAD containing `userId=u2`
- **THEN** AES-GCM authentication SHALL fail and decryption SHALL be rejected

#### Scenario: AAD prevents update/snapshot kind confusion

- **WHEN** a ciphertext encrypted with `kind=update` is decrypted with `kind=snapshot`
- **THEN** AES-GCM authentication SHALL fail and decryption SHALL be rejected

### Requirement: Encryption key id is sent with every upload

Every push and compact request body SHALL include the `encryptionKeyId` field identifying which master key was used to encrypt the blob.

#### Scenario: Push body includes encryption key id

- **WHEN** the sync engine sends a push request
- **THEN** the JSON body SHALL include `encryptionKeyId` matching the `id` of the active `user_encryption_key` record

#### Scenario: Compact body includes encryption key id

- **WHEN** the sync engine sends a compact request
- **THEN** the JSON body SHALL include `encryptionKeyId` matching the `id` of the active `user_encryption_key` record

### Requirement: Encryption context provides key material to the sync engine

The system SHALL expose a React context that provides `{ masterKey: Uint8Array; keyId: string }` to its subtree after the encryption session is unlocked. `useSyncEngine` SHALL read this context to obtain the key material needed for encrypt and decrypt operations.

#### Scenario: Sync engine reads key material from context

- **WHEN** `useSyncEngine` prepares a push or compact
- **THEN** it SHALL read `masterKey` and `keyId` from `EncryptionContext`
- **AND** use them to encrypt the blob and populate `encryptionKeyId` in the request body

#### Scenario: Sync engine reads key material for decryption

- **WHEN** `useSyncEngine` processes records from a pull response
- **THEN** it SHALL read `masterKey` from `EncryptionContext` to decrypt each blob

## ADDED Requirements

### Requirement: Sync blobs are encrypted before upload

The sync engine SHALL encrypt every Yjs delta and snapshot blob using AES-256-GCM with a random 12-byte IV before sending it to the server. The encrypted blob SHALL use the format `[enc_version: u8][iv: 12 bytes][ciphertext…]`. The plaintext SHALL never leave the browser.

#### Scenario: Push encrypts delta before upload

- **WHEN** the sync engine prepares a push
- **THEN** it SHALL generate a random 12-byte IV
- **AND** encrypt the Yjs delta bytes using AES-256-GCM with the session master key
- **AND** prepend `[enc_version: 1][iv]` to the ciphertext
- **AND** send the resulting bytes (base64-encoded) as the `blob` field in the request body

#### Scenario: Compact encrypts snapshot before upload

- **WHEN** the sync engine prepares a compact
- **THEN** it SHALL encrypt the full Yjs snapshot using the same `[enc_version][iv][ciphertext]` format
- **AND** send it as the `blob` field in the compact request body

### Requirement: Received sync blobs are decrypted before application

The sync engine SHALL decrypt every received blob before applying it to the Y.Doc. The blob format `[enc_version: u8][iv: 12 bytes][ciphertext…]` SHALL be parsed to extract the IV and ciphertext, then decrypted using AES-256-GCM with the session master key.

#### Scenario: Pull decrypts records before applying to Y.Doc

- **WHEN** the sync engine receives records from a pull response
- **THEN** for each record it SHALL read the first byte as `enc_version`, the next 12 bytes as `iv`, and the remainder as ciphertext
- **AND** decrypt the ciphertext using AES-256-GCM
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

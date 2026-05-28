## MODIFIED Requirements

### Requirement: PIN wrapper schema stores all fields needed for hardware-bound MEK unwrap

The `local_wrapper` IndexedDB store SHALL support a `method: 'pin'` record with the following fields:

- `userId` (string, keyPath)
- `method: 'pin'`
- `wrapperId` (string, UUID)
- `pinLdk` (CryptoKey, `extractable: false`, AES-256-GCM)
- `pinSaltCiphertext` (Uint8Array)
- `pinEncryptionAlgorithm: 'aes-256-gcm'`
- `pinEncryptionParams` (`{ iv: Uint8Array, tagBits: 128 }`)
- `kdfAlgorithm: 'argon2id'`
- `kdfParams` (`{ memorySize, iterations, parallelism, hashLength }`)
- `ciphertext` (Uint8Array — MEK wrapped with KEK)
- `wrappingAlgorithm: 'aes-256-gcm'`
- `wrappingParams` (`{ iv: Uint8Array, tagBits: 128 }`)
- `createdAt` (ISO string)
- `failedAttempts` (number)

The record SHALL NOT contain `pinEncryptionVersion`, `wrappingVersion`, `kdfVersion`, standalone `pinSaltIv`, or standalone `wrappingIv` fields.

#### Scenario: PIN wrapper record passes schema validation

- **WHEN** a PIN wrapper record is read from IndexedDB
- **THEN** it SHALL parse successfully against the `localWrapperRecordPinSchema`
- **AND** `method` SHALL equal `'pin'`
- **AND** `pinLdk` SHALL be a CryptoKey with `extractable: false`
- **AND** `pinEncryptionParams.iv` SHALL be a Uint8Array
- **AND** `wrappingParams.iv` SHALL be a Uint8Array
- **AND** the record SHALL NOT have a standalone `pinSaltIv` or `wrappingIv` field

### Requirement: PIN wrapper uses hardware-bound KDF salt

When creating a PIN wrapper, the system SHALL generate a random 16-byte salt, encrypt it with a freshly generated non-extractable AES-256-GCM pinLDK, and store the encrypted salt alongside the pinLDK. The IV used to encrypt the salt SHALL be stored inside `pinEncryptionParams`. The plaintext salt SHALL NOT be stored.

#### Scenario: Creating a PIN wrapper encrypts the KDF salt

- **WHEN** the system creates a PIN wrapper for a given PIN
- **THEN** it SHALL generate a random non-extractable AES-256-GCM CryptoKey as `pinLdk`
- **AND** generate a random 16-byte `salt`
- **AND** encrypt `salt` with `pinLdk` using AES-256-GCM with AAD `autokpo:e2ee-pin-salt:v1:{userId}:{wrapperId}`
- **AND** store the resulting ciphertext as `pinSaltCiphertext` and the IV inside `pinEncryptionParams: { iv, tagBits: 128 }`
- **AND** NOT store a standalone `pinSaltIv` field
- **AND** NOT store the plaintext `salt`

#### Scenario: Unlocking decrypts salt before KDF

- **WHEN** the system attempts to unlock using a PIN wrapper
- **THEN** it SHALL first decrypt `pinSaltCiphertext` using `pinLdk` with IV from `pinEncryptionParams.iv` and AAD `autokpo:e2ee-pin-salt:v1:{userId}:{wrapperId}`
- **AND** pass the decrypted salt to Argon2id together with the entered PIN

### Requirement: PIN wrapper derives KEK with Argon2id and wraps MEK

The system SHALL derive a Key Encryption Key (KEK) from the PIN using Argon2id with the decrypted hardware-bound salt and `KDF_PARAMS_V1`. The KEK SHALL be used to wrap the MEK with AES-256-GCM. The wrapping IV SHALL be stored inside `wrappingParams`. The AAD for MEK wrapping SHALL be `autokpo:e2ee-wrapped-mek:v1:{userId}:{wrapperId}:pin`.

#### Scenario: PIN wraps MEK and stores wrapping IV inside params

- **WHEN** the system wraps the MEK with the PIN-derived KEK
- **THEN** it SHALL store the wrapping IV inside `wrappingParams: { iv, tagBits: 128 }`
- **AND** SHALL NOT store a standalone `wrappingIv` field
- **AND** SHALL use AAD `autokpo:e2ee-wrapped-mek:v1:{userId}:{wrapperId}:pin`

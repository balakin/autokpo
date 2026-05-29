## Purpose

Define the PIN-based local wrapper schema and cryptographic protocol for hardware-bound MEK wrapping using Argon2id KDF.

## Requirements

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

### Requirement: Creating a PIN wrapper replaces any existing local wrapper

When the user sets a PIN, the system SHALL write the new `method: 'pin'` record to the `local_wrapper` store, which overwrites any existing `method: 'ldk'` record for the same `userId`.

#### Scenario: Setting PIN removes LDK wrapper

- **WHEN** the user sets a PIN while a `method: 'ldk'` wrapper exists
- **THEN** the `local_wrapper` store SHALL contain only the new `method: 'pin'` record for that user
- **AND** the old LDK record SHALL no longer be present

### Requirement: Failed PIN attempts are counted and trigger wipe at 10

Each failed PIN unlock attempt SHALL increment `failedAttempts` in the PIN wrapper record. When `failedAttempts` reaches 10, the system SHALL delete the PIN wrapper record from IndexedDB, clearing all PIN-related local data.

#### Scenario: Failed attempt increments counter

- **WHEN** a PIN unlock attempt fails
- **THEN** the system SHALL increment `failedAttempts` in the stored PIN wrapper record

#### Scenario: Tenth failure deletes the PIN wrapper

- **WHEN** `failedAttempts` reaches 10
- **THEN** the system SHALL delete the `local_wrapper` record for that user
- **AND** subsequent gate checks SHALL find no local wrapper and fall through to password unlock

#### Scenario: Successful unlock resets failed attempts

- **WHEN** a PIN unlock attempt succeeds
- **THEN** the system SHALL reset `failedAttempts` to 0 in the stored PIN wrapper record

### Requirement: Switching back to LDK replaces PIN wrapper with a new LDK wrapper

When the user switches from PIN to LDK auto-unlock in Settings, the system SHALL generate a new LDK, wrap the MEK, and write a `method: 'ldk'` record, overwriting the PIN wrapper.

#### Scenario: Switching to LDK removes PIN wrapper

- **WHEN** the user chooses to switch to auto-unlock (LDK) from Settings
- **THEN** the system SHALL generate a new LDK and write a `method: 'ldk'` record
- **AND** the `local_wrapper` store SHALL contain only the new `method: 'ldk'` record for that user

### Requirement: PIN verifies master password change when PIN local wrapper is active

When a user with an active PIN local wrapper changes the master password, the system SHALL use the PIN to verify access to the existing MEK before allowing the password change to proceed. This verification SHALL use the stored PIN local wrapper and the same cryptographic unwrap path as PIN unlock.

#### Scenario: Correct PIN authorizes password change verification

- **WHEN** the user starts a master password change
- **AND** the current `local_wrapper` record has `method: 'pin'`
- **AND** the user enters the correct PIN
- **THEN** the system SHALL unwrap the MEK through the PIN wrapper successfully
- **AND** the system SHALL allow the user to continue to new master password entry

#### Scenario: Incorrect PIN counts toward retry limit

- **WHEN** the user enters an incorrect PIN while verifying a master password change
- **THEN** the system SHALL treat the attempt as a failed PIN verification attempt
- **AND** the system SHALL NOT allow the password change to proceed for that attempt

#### Scenario: PIN retry limit during password change clears encryption session

- **WHEN** PIN verification for master password change reaches 10 failed attempts
- **THEN** the system SHALL clear in-memory encryption key material for the current app session
- **AND** the system SHALL require the user to unlock encryption again before accessing Security settings

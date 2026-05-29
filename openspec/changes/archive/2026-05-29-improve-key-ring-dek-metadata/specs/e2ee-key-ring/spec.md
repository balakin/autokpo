## REMOVED Requirements

### Requirement: Key ring plaintext carries revision

**Reason**: `revision` and `activeDekId` are already cryptographically bound by AES-GCM AAD; duplicating them in the plaintext adds bytes with no security benefit. `version` is moved to the outer record as `plaintextSchemaVersion` so the decoder knows the format before parsing the bytes. The post-decryption consistency check now uses `activeDekId` from the outer backend record.
**Migration**: Remove `version`, `revision`, and `activeDekId` from the plaintext JSON. Add `plaintextSchemaVersion: 1` to the outer key ring record and all relevant request schemas. Update `decryptKeyRingWithMek` to check `keyRing.activeDekId in deks` using the outer record value.

## MODIFIED Requirements

### Requirement: Browser creates encrypted key ring during setup

The system SHALL create a browser-side E2EE key ring when an authenticated user completes first-time encryption setup. The browser SHALL generate a random MEK and a random DEK, store the DEK as a `DekEntry` object inside the plaintext key-ring `deks` map keyed by DEK id, encrypt the key ring with the MEK, and never send plaintext MEK or DEK bytes to the backend. The outer key ring record SHALL carry `plaintextSchemaVersion: 1`. The plaintext SHALL NOT contain `version`, `revision`, or `activeDekId` fields.

#### Scenario: Setup creates MEK, DEK, and encrypted key ring

- **WHEN** an authenticated user submits a valid encryption setup password and acknowledgement
- **THEN** the browser SHALL generate a random MEK
- **AND** the browser SHALL generate a random DEK
- **AND** the browser SHALL create a plaintext key ring containing exactly one `deks` map entry of the form `{ key: <base64 DEK bytes>, createdAt: <Date.now() ms>, retiredAt: null }`
- **AND** the browser SHALL set the key ring `activeDekId` to that DEK id on the outer record
- **AND** the browser SHALL encrypt the plaintext key ring with the MEK before persistence
- **AND** the outer key ring record SHALL include `plaintextSchemaVersion: 1`
- **AND** the plaintext key ring SHALL NOT include `version`, `revision`, or `activeDekId` fields
- **AND** the backend SHALL NOT receive plaintext MEK or DEK bytes

### Requirement: Unlock decrypts key ring locally

The system SHALL unlock encryption by deriving the KEK locally, unwrapping the MEK locally, decrypting the key ring locally, and exposing the active DEK for the current app session. After decryption the system SHALL verify that the outer record's `activeDekId` is present as a key in the decrypted `deks` map.

#### Scenario: Correct password unlocks active DEK

- **WHEN** an authenticated user provides the correct encryption password
- **AND** an active password wrapper and encrypted key ring are available
- **THEN** the system SHALL derive the KEK locally
- **AND** the system SHALL decrypt the wrapped MEK locally using the wrapper id and method in AAD
- **AND** the system SHALL decrypt the key ring locally using the MEK
- **AND** the system SHALL verify that `keyRing.activeDekId` is a key in the decrypted `deks` map
- **AND** the system SHALL read the active DEK's raw key bytes from `deks[activeDekId].key`
- **AND** the system SHALL keep plaintext MEK, plaintext key ring, and active DEK material in memory only for the current unlocked app session

#### Scenario: Incorrect password does not unlock key ring

- **WHEN** an authenticated user provides an incorrect encryption password
- **THEN** AES-GCM unwrap of the MEK SHALL fail
- **AND** the system SHALL keep encryption locked
- **AND** the system SHALL NOT clear the authenticated session

#### Scenario: Decrypted deks missing active DEK id causes unlock failure

- **WHEN** the browser decrypts key-ring ciphertext successfully
- **AND** the outer record's `activeDekId` is not a key in the decrypted `deks` map
- **THEN** unlock SHALL fail with the existing key-ring unlock error
- **AND** plaintext key material SHALL NOT be exposed to the app session

### Requirement: Compaction rotates the active DEK

The system SHALL rotate the encrypted key ring as the first step of a sync compact session when the current key-ring revision is not newer than the compact basis revision. Rotation SHALL generate a new random DEK, add it to the plaintext key-ring `deks` map as a `DekEntry` with `createdAt = Date.now()` and `retiredAt = null`, stamp the outgoing active DEK's entry with `retiredAt = Date.now()`, set `activeDekId` to the new DEK id on the outer record, increment the key-ring revision through the existing revision-guarded key-ring update path, and keep previous DEKs in the key ring for read access.

#### Scenario: Compact session rotates before preparing snapshot

- **WHEN** the sync engine starts a compact session
- **AND** the current key-ring revision is less than or equal to the maximum key-ring revision represented by rows covered by the compact basis
- **THEN** the browser SHALL generate a new random DEK
- **AND** the browser SHALL add the new DEK to the plaintext key-ring `deks` map as `{ key: <base64>, createdAt: <Date.now() ms>, retiredAt: null }`
- **AND** the browser SHALL stamp the outgoing active DEK entry with `retiredAt = Date.now()` before writing
- **AND** the browser SHALL set `activeDekId` to the new DEK id on the outer record
- **AND** the browser SHALL update the encrypted key-ring profile using the current revision as the revision precondition
- **AND** the browser SHALL prepare the compact snapshot only after the key-ring update succeeds

#### Scenario: Existing newer revision is reused

- **WHEN** the sync engine starts or restarts a compact session
- **AND** the current key-ring revision is greater than the maximum key-ring revision represented by rows covered by the compact basis
- **THEN** the browser SHALL NOT rotate the key ring again for that compact session
- **AND** the browser SHALL prepare the compact snapshot using the current active DEK and current key-ring revision

### Requirement: Unlocked key ring exposes DEKs by id

The system SHALL expose enough decrypted key-ring material to encrypted app code to retrieve a DEK by id for read operations while still exposing the active DEK id for write operations. Plaintext DEK material SHALL remain in memory only for the current unlocked app session. Each DEK entry in memory SHALL carry `key`, `createdAt`, and `retiredAt` fields.

#### Scenario: Sync decrypts old rows after rotation

- **WHEN** the key ring contains multiple DEKs
- **AND** a pulled sync row references a previous DEK id in `encryptionKeyId`
- **THEN** the sync engine SHALL retrieve that DEK's raw key bytes from `deks[encryptionKeyId].key` in the unlocked key-ring material
- **AND** the sync engine SHALL use that DEK to decrypt the row
- **AND** the sync engine SHALL continue using the active DEK id for new uploads

## ADDED Requirements

### Requirement: Each DEK carries creation and retirement timestamps

Every DEK entry in the key ring plaintext SHALL carry `createdAt` and `retiredAt` fields as millisecond Unix timestamps (`number`). `createdAt` SHALL be set to `Date.now()` when the DEK is generated. `retiredAt` SHALL be `null` while the DEK is active and SHALL be set to `Date.now()` when a rotation replaces it with a new active DEK.

#### Scenario: Initial DEK has createdAt and null retiredAt

- **WHEN** the browser creates the initial encrypted key-ring profile during setup
- **THEN** the single DEK entry in the plaintext `deks` map SHALL have `createdAt` equal to the current millisecond timestamp
- **AND** `retiredAt` SHALL be `null`

#### Scenario: Rotation stamps outgoing DEK with retiredAt

- **WHEN** the browser generates a new DEK during a key-ring rotation
- **THEN** the outgoing active DEK entry SHALL be updated with `retiredAt = Date.now()` before the new plaintext is encrypted
- **AND** the new DEK entry SHALL have `createdAt = Date.now()` and `retiredAt = null`
- **AND** already-retired DEKs SHALL retain their original `retiredAt` value

#### Scenario: Already-retired DEKs are not re-stamped

- **WHEN** a second or subsequent rotation occurs
- **AND** the key ring already contains DEKs with non-null `retiredAt`
- **THEN** the system SHALL NOT modify `retiredAt` on any DEK other than the outgoing active DEK

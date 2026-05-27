## MODIFIED Requirements

### Requirement: Backend stores key ring and active wrapper metadata

The system SHALL persist one key ring per authenticated user and password wrapper metadata without receiving password plaintext, KEK bytes, plaintext MEK bytes, plaintext DEK bytes, or plaintext key-ring JSON. Key-ring setup SHALL persist the key-ring row and initial active password wrapper in one atomic D1 batch, relying on database constraints rather than a preflight existence check as the authority for duplicate setup races.

#### Scenario: Setup stores key ring and password wrapper

- **WHEN** setup saves the key-ring profile
- **THEN** the backend SHALL create one `key_ring` row for the authenticated user
- **AND** the backend SHALL store `activeDekId`, `revision`, `encryptionAlgorithm`, `encryptionVersion`, `iv`, and encrypted key-ring `ciphertext`
- **AND** the backend SHALL initialize `revision` to `1`
- **AND** the backend SHALL create one `key_ring_wrapping` row with method `password` and status `active`
- **AND** the backend SHALL store the frontend-provided wrapper id without replacing it
- **AND** the backend SHALL store KDF parameters, KDF salt, wrapping algorithm, wrapping version, `wrappingIv`, and wrapped MEK `ciphertext`
- **AND** the backend SHALL persist the key-ring row and password-wrapper row atomically so neither row remains without the other after a failed setup write
- **AND** the backend SHALL NOT store the encryption password, KEK, plaintext MEK, plaintext DEK, or plaintext key ring

#### Scenario: Duplicate setup is rejected

- **WHEN** an authenticated user already has a key ring
- **AND** the user submits another key-ring setup request
- **THEN** the backend SHALL reject the request with a conflict error
- **AND** the backend SHALL NOT rely on a preflight existence read as the authority for duplicate prevention

### Requirement: Key ring AAD binds ciphertext to user and active DEK

The system SHALL use AES-256-GCM AAD for encrypted key-ring ciphertext constructed as `autokpo:e2ee-key-ring:v1:{userId}:{activeDekId}:{revision}`.

#### Scenario: Key ring ciphertext is bound to user, active DEK, and revision

- **WHEN** the browser encrypts or decrypts key-ring ciphertext
- **THEN** it SHALL use the MEK, the key-ring IV, and AAD `autokpo:e2ee-key-ring:v1:{userId}:{activeDekId}:{revision}`
- **AND** ciphertext moved to another user, active DEK id, or key-ring revision SHALL fail AES-GCM authentication

## ADDED Requirements

### Requirement: Key ring plaintext carries revision

The browser SHALL include the key-ring revision inside the encrypted key-ring plaintext and SHALL validate it against serialized key-ring metadata after decryption.

#### Scenario: Setup creates revisioned key ring plaintext

- **WHEN** the browser creates the initial encrypted key-ring profile
- **THEN** the plaintext key-ring JSON SHALL include `revision` equal to `1`
- **AND** the plaintext key-ring JSON SHALL include `activeDekId` equal to the serialized key-ring `activeDekId`

#### Scenario: Unlock rejects mismatched plaintext metadata

- **WHEN** the browser decrypts key-ring ciphertext successfully
- **AND** the plaintext `revision` does not equal the serialized key-ring `revision`
- **THEN** unlock SHALL fail with the existing key-ring unlock error
- **AND** plaintext key material SHALL NOT be exposed to the app session

#### Scenario: Unlock rejects mismatched active DEK id

- **WHEN** the browser decrypts key-ring ciphertext successfully
- **AND** the plaintext `activeDekId` does not equal the serialized key-ring `activeDekId`
- **THEN** unlock SHALL fail with the existing key-ring unlock error
- **AND** plaintext key material SHALL NOT be exposed to the app session

### Requirement: Backend atomically updates the encrypted key ring

The backend SHALL expose `PUT /api/e2ee/key-ring` to replace the encrypted key-ring payload for the authenticated user. The request SHALL include `currentRevision`, `activeDekId`, supported key-ring encryption metadata, key-ring IV, and encrypted key-ring ciphertext. The backend SHALL update the key-ring row only when the stored revision equals `currentRevision`, and the conditional mutation plus required postcondition assertion SHALL execute in one D1 batch.

#### Scenario: Matching revision updates key ring

- **WHEN** an authenticated user submits a valid key-ring update request
- **AND** `currentRevision` equals the stored key-ring revision
- **THEN** the backend SHALL replace `activeDekId`, `iv`, and encrypted key-ring `ciphertext`
- **AND** the backend SHALL set `revision` to `currentRevision + 1`
- **AND** the backend SHALL update `updatedAt`
- **AND** the backend SHALL assert inside the D1 batch that the row exists with `revision = currentRevision + 1` and the submitted `activeDekId`
- **AND** the backend SHALL return the updated serialized key-ring profile using the same shape as key-ring fetch

#### Scenario: Stale revision is rejected

- **WHEN** an authenticated user submits a valid key-ring update request
- **AND** `currentRevision` does not equal the stored key-ring revision
- **THEN** the backend SHALL reject the request with `409` and code `key_ring_revision_conflict`
- **AND** the backend SHALL NOT replace the encrypted key-ring ciphertext
- **AND** any partial key-ring mutation attempted in the same D1 batch SHALL be rolled back

#### Scenario: Update validates key-ring encryption parameters

- **WHEN** an authenticated user submits a key-ring update request with unsupported encryption parameters, invalid UUIDs, invalid base64, or incorrect IV length
- **THEN** the backend SHALL reject the request with a validation error
- **AND** the backend SHALL NOT change the key-ring row
- **AND** the backend SHALL NOT require or receive plaintext MEK, plaintext DEK, or plaintext key-ring JSON

### Requirement: Client handles key-ring update responses

The client SHALL replace its cached encrypted key-ring profile with the server response after a successful key-ring update. When a key-ring update reports a stale revision conflict, the client SHALL refetch the latest key-ring profile and SHALL NOT automatically retry the rejected mutation.

#### Scenario: Successful update refreshes encrypted local cache

- **WHEN** the key-ring update endpoint returns an updated serialized key-ring profile
- **THEN** the client SHALL write the returned encrypted key-ring record to the `key_ring` IndexedDB object store for the authenticated user
- **AND** the client SHALL write the returned active password wrapper records to the `wrapper` IndexedDB object store for the authenticated user

#### Scenario: Revision conflict refetches latest profile

- **WHEN** the key-ring update endpoint rejects the request with code `key_ring_revision_conflict`
- **THEN** the client SHALL request the latest key-ring profile
- **AND** the client SHALL update the encrypted local cache from the fetched profile
- **AND** the client SHALL NOT automatically retry the rejected key-ring mutation

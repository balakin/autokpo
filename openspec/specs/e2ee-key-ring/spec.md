# e2ee-key-ring Specification

## Purpose

TBD - created by archiving change key-ring. Update Purpose after archive.

## Requirements

### Requirement: Browser creates encrypted key ring during setup

The system SHALL create a browser-side E2EE key ring when an authenticated user completes first-time encryption setup. The browser SHALL generate a random MEK and a random DEK, store the raw DEK bytes as a base64 value inside a plaintext key-ring `deks` map keyed by DEK id, encrypt the key ring with the MEK, and never send plaintext MEK or DEK bytes to the backend. The plaintext DEK entry SHALL NOT duplicate encryption algorithm, version, or IV metadata because that metadata belongs to each encrypted payload/envelope.

#### Scenario: Setup creates MEK, DEK, and encrypted key ring

- **WHEN** an authenticated user submits a valid encryption setup password and acknowledgement
- **THEN** the browser SHALL generate a random MEK
- **AND** the browser SHALL generate a random DEK
- **AND** the browser SHALL create a plaintext key ring containing exactly one DEK map entry whose value is the base64 raw DEK bytes
- **AND** the browser SHALL set the key ring `activeDekId` to that DEK id
- **AND** the browser SHALL encrypt the plaintext key ring with the MEK before persistence
- **AND** the backend SHALL NOT receive plaintext MEK or DEK bytes

### Requirement: Password-derived KEK wraps MEK locally

The system SHALL derive a KEK from the encryption password locally and use it to wrap the MEK before persistence. The wrapped MEK SHALL use AES-256-GCM with a random wrapping IV and AAD bound to the user id, wrapper id, and wrapper method.

#### Scenario: Setup wraps MEK with password-derived KEK

- **WHEN** the user completes encryption setup
- **THEN** the system SHALL derive a KEK using Argon2id with stored versioned parameters and a random salt
- **AND** the browser SHALL generate a wrapper id before wrapping the MEK
- **AND** the system SHALL encrypt the MEK using AES-256-GCM with a random IV stored inside `wrappingParams`
- **AND** the system SHALL use AAD `autokpo:e2ee-wrapped-mek:v1:{userId}:{wrapperId}:{method}`
- **AND** the wrapper record SHALL NOT contain a standalone `wrappingIv` field

### Requirement: Backend stores key ring and active wrapper metadata

The system SHALL persist one key ring per authenticated user and password wrapper metadata without receiving password plaintext, KEK bytes, plaintext MEK bytes, plaintext DEK bytes, or plaintext key-ring JSON. Key-ring setup SHALL persist the key-ring row and initial active password wrapper in one atomic D1 batch, relying on database constraints rather than a preflight existence check as the authority for duplicate setup races.

#### Scenario: Setup stores key ring and password wrapper

- **WHEN** setup saves the key-ring profile
- **THEN** the backend SHALL create one `key_ring` row for the authenticated user
- **AND** the backend SHALL store `activeDekId`, `revision`, `encryptionAlgorithm`, `encryptionParams` (containing `iv` and `tagBits`), and encrypted key-ring `ciphertext`
- **AND** the backend SHALL NOT store a separate `encryptionVersion` or `iv` field outside `encryptionParams`
- **AND** the backend SHALL initialize `revision` to `1`
- **AND** the backend SHALL create one `key_ring_wrapping` row with method `password` and status `active`
- **AND** the backend SHALL store the frontend-provided wrapper id without replacing it
- **AND** the backend SHALL store KDF algorithm, KDF params, KDF salt, wrapping algorithm, `wrappingParams` (containing `iv` and `tagBits`), and wrapped MEK `ciphertext`
- **AND** the backend SHALL NOT store separate `wrappingVersion`, `wrappingIv`, or `kdfVersion` fields
- **AND** the backend SHALL persist the key-ring row and password-wrapper row atomically so neither row remains without the other after a failed setup write
- **AND** the backend SHALL NOT store the encryption password, KEK, plaintext MEK, plaintext DEK, or plaintext key ring

#### Scenario: Duplicate setup is rejected

- **WHEN** an authenticated user already has a key ring
- **AND** the user submits another key-ring setup request
- **THEN** the backend SHALL reject the request with a conflict error
- **AND** the backend SHALL NOT rely on a preflight existence read as the authority for duplicate prevention

### Requirement: Wrapper lifecycle state is stored and constrained

The system SHALL store wrapper lifecycle state with statuses `active` and `revoked`. The database SHALL enforce at most one active wrapper for each authenticated user and wrapper method.

#### Scenario: One active wrapper per method

- **WHEN** the backend stores an active wrapper for a user and method
- **THEN** the database SHALL reject any second active wrapper for the same user and method
- **AND** the database SHALL allow revoked wrappers for the same user and method

#### Scenario: Active wrappers are returned without lifecycle state

- **WHEN** the client fetches the key-ring profile
- **THEN** the backend SHALL return only active wrappers
- **AND** the backend SHALL return at most one wrapper per method
- **AND** the response SHALL include wrapper `id` for decrypting AAD-bound wrapped MEK ciphertext
- **AND** the response SHALL NOT include wrapper `status` or `revokedAt`

### Requirement: Unlock decrypts key ring locally

The system SHALL unlock encryption by deriving the KEK locally, unwrapping the MEK locally, decrypting the key ring locally, and exposing the active DEK for the current app session.

#### Scenario: Correct password unlocks active DEK

- **WHEN** an authenticated user provides the correct encryption password
- **AND** an active password wrapper and encrypted key ring are available
- **THEN** the system SHALL derive the KEK locally
- **AND** the system SHALL decrypt the wrapped MEK locally using the wrapper id and method in AAD
- **AND** the system SHALL decrypt the key ring locally using the MEK
- **AND** the system SHALL read the active DEK's raw key bytes from the decrypted key ring by `activeDekId`
- **AND** the system SHALL keep plaintext MEK, plaintext key ring, and active DEK material in memory only for the current unlocked app session

#### Scenario: Incorrect password does not unlock key ring

- **WHEN** an authenticated user provides an incorrect encryption password
- **THEN** AES-GCM unwrap of the MEK SHALL fail
- **AND** the system SHALL keep encryption locked
- **AND** the system SHALL NOT clear the authenticated session

### Requirement: Key ring cache stores encrypted profile only

The system SHALL cache only the encrypted key-ring profile locally. The cache SHALL contain encrypted key-ring metadata/ciphertext and active wrapper metadata/ciphertext, and SHALL NOT contain plaintext MEK, plaintext DEK, or plaintext key-ring JSON. The cache SHALL be stored in the `key_ring` and `wrapper` IndexedDB object stores in the `autokpo-e2ee` database, replacing the previous localStorage cache.

#### Scenario: Successful fetch updates encrypted cache

- **WHEN** the backend returns a key-ring profile
- **THEN** the system SHALL write the encrypted key-ring record to the `key_ring` IndexedDB object store for the authenticated user
- **AND** the system SHALL write the password wrapper fields to the `wrapper` IndexedDB object store for the authenticated user
- **AND** the cached records SHALL include the encrypted key ring and active wrapper needed for a later unlock attempt

#### Scenario: Network-unavailable unlock may use encrypted cache

- **WHEN** the backend key-ring endpoint is unavailable due to offline or network failure
- **AND** a cached encrypted key-ring record exists in IndexedDB for the authenticated user
- **THEN** the system MAY use the cached encrypted record for unlock
- **AND** the user SHALL still provide the encryption password to unwrap the MEK if no LDK is present

#### Scenario: Non-network backend results do not fall back to cache

- **WHEN** the backend key-ring request returns an authentication, not-found, conflict, validation, or contract error
- **THEN** the system SHALL NOT use the local encrypted IndexedDB cache as a fallback for that result

#### Scenario: Password wrapper is cached locally after first unlock

- **WHEN** the user successfully unlocks encryption with a password
- **AND** the `wrapper` IndexedDB store is empty for that user
- **THEN** the system SHALL persist the password wrapper fields from the server response into the `wrapper` store
- **AND** subsequent offline unlock attempts SHALL use the locally cached `wrapper` record

### Requirement: Key ring AAD binds ciphertext to user and active DEK

The system SHALL use AES-256-GCM AAD for encrypted key-ring ciphertext constructed as `autokpo:e2ee-key-ring:v1:{userId}:{activeDekId}:{revision}`.

#### Scenario: Key ring ciphertext is bound to user, active DEK, and revision

- **WHEN** the browser encrypts or decrypts key-ring ciphertext
- **THEN** it SHALL use the MEK, the key-ring IV, and AAD `autokpo:e2ee-key-ring:v1:{userId}:{activeDekId}:{revision}`
- **AND** ciphertext moved to another user, active DEK id, or key-ring revision SHALL fail AES-GCM authentication

### Requirement: Active DEK is exposed to encrypted app code

The system SHALL expose the unlocked active DEK and active DEK id to encrypted app code after setup or unlock succeeds.

#### Scenario: Encryption context exposes active DEK

- **WHEN** setup or unlock succeeds
- **THEN** the encryption context SHALL provide a non-null active DEK and active DEK id to its subtree
- **AND** the context SHALL NOT expose plaintext key material before setup or unlock succeeds

### Requirement: Master password change replaces only the active password wrapper

The system SHALL allow an authenticated user with an unlocked encryption session to change the master password by wrapping the existing MEK with a KEK derived from the new password. The password change SHALL NOT rotate the MEK, rotate the active DEK, modify the encrypted key-ring ciphertext, or modify local unlock wrappers.

#### Scenario: Client creates a new wrapper for the existing MEK

- **WHEN** the user submits a valid master password change request from an unlocked encryption session
- **THEN** the browser SHALL derive a KEK from the new master password using the supported Argon2id parameters and a new random salt
- **AND** the browser SHALL generate a new password wrapper id and random wrapping IV
- **AND** the browser SHALL wrap the existing in-memory MEK with AES-256-GCM using AAD `autokpo:e2ee-wrapped-mek:v1:{userId}:{wrapperId}:password`
- **AND** the browser SHALL NOT generate a new MEK or DEK
- **AND** the browser SHALL NOT modify the local `local_wrapper` record

#### Scenario: Same password value is allowed

- **WHEN** the user submits a new master password equal to the current master password
- **THEN** the system SHALL allow the change if the password satisfies the existing master-password validation rules
- **AND** the system SHALL still create a new password wrapper with new salt, IV, and wrapper id

### Requirement: Backend atomically changes the active password wrapper

The backend SHALL expose `POST /api/e2ee/key-ring/change-password` to atomically replace the active password wrapper for the authenticated user. The request SHALL include `currentWrappingId` and the new wrapper metadata/ciphertext. The backend SHALL revoke the current active password wrapper and insert the new active password wrapper in one atomic D1 batch only when the active wrapper id matches `currentWrappingId`.

#### Scenario: Matching current wrapper is replaced

- **WHEN** an authenticated user submits a valid change-password request
- **AND** `currentWrappingId` matches the user's active password wrapper
- **THEN** the backend SHALL mark the matched wrapper as `revoked` and set `revokedAt`
- **AND** the backend SHALL assert inside the D1 batch that the matched wrapper was revoked before inserting the replacement wrapper
- **AND** the backend SHALL insert the new password wrapper with method `password` and status `active`
- **AND** the backend SHALL preserve the existing `key_ring` row and encrypted key-ring ciphertext
- **AND** the backend SHALL return a success response without returning the full key-ring profile

#### Scenario: Stale current wrapper is rejected

- **WHEN** an authenticated user submits a change-password request
- **AND** `currentWrappingId` does not match the user's active password wrapper
- **THEN** the backend SHALL reject the request with a conflict response
- **AND** the backend SHALL NOT revoke the active password wrapper
- **AND** the backend SHALL NOT insert the submitted wrapper as active
- **AND** any partial wrapper mutation attempted in the same D1 batch SHALL be rolled back

#### Scenario: Replacement keeps one active password wrapper

- **WHEN** a password wrapper replacement succeeds
- **THEN** the backend SHALL have exactly one active password wrapper for the authenticated user and password method
- **AND** previous password wrappers for that user and method SHALL remain stored only as revoked wrappers

### Requirement: Change-password endpoint validates wrapper parameters

The change-password endpoint SHALL validate the submitted wrapper's public structure and supported cryptographic parameters. The backend SHALL NOT require or receive the plaintext master password, KEK, MEK, DEK, or plaintext key-ring JSON.

#### Scenario: Invalid wrapper parameters are rejected

- **WHEN** an authenticated user submits a change-password request with unsupported KDF parameters, unsupported wrapping parameters, invalid UUIDs, invalid base64, or incorrect salt/IV/ciphertext lengths
- **THEN** the backend SHALL reject the request with a validation error
- **AND** the backend SHALL NOT change the active password wrapper

#### Scenario: Backend does not verify plaintext MEK

- **WHEN** an authenticated user submits a structurally valid new password wrapper
- **THEN** the backend SHALL persist the wrapper without decrypting the ciphertext
- **AND** the backend SHALL NOT receive the plaintext MEK or KEK needed to verify the ciphertext contents

### Requirement: Client refetches key-ring profile after password change

After a successful password change, the client SHALL refetch the key-ring profile through the existing key-ring fetch path so the local encrypted cache stores the new active password wrapper.

#### Scenario: Successful change refreshes cached server wrapper

- **WHEN** the change-password endpoint returns success
- **THEN** the client SHALL request the latest key-ring profile
- **AND** the client SHALL update the local encrypted key-ring and password wrapper cache from the fetched profile
- **AND** the client SHALL leave the local unlock wrapper unchanged

#### Scenario: Refetch failure uses existing error handling

- **WHEN** the change-password endpoint returns success
- **AND** the subsequent key-ring profile refetch fails
- **THEN** the client SHALL surface the error using the current key-ring fetch error handling
- **AND** a later unlock SHALL use the latest server password wrapper when the key-ring profile is fetched successfully

### Requirement: Stale wrapper conflict clears encryption session

The client SHALL clear the unlocked encryption session when the change-password endpoint reports that `currentWrappingId` is stale or wrong. The authenticated account session SHALL remain active.

#### Scenario: Conflict clears encryption and refetches profile

- **WHEN** the change-password endpoint rejects the request because `currentWrappingId` is stale or wrong
- **THEN** the client SHALL clear in-memory encryption key material for the current app session
- **AND** the client SHALL refetch the key-ring profile
- **AND** the client SHALL require the user to unlock encryption again
- **AND** the client SHALL NOT sign the user out solely because of this conflict

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

### Requirement: Compaction rotates the active DEK

The system SHALL rotate the encrypted key ring as the first step of a sync compact session when the current key-ring revision is not newer than the compact basis revision. Rotation SHALL generate a new random DEK, add it to the plaintext key-ring `deks` map, set `activeDekId` to the new DEK id, increment the key-ring revision through the existing revision-guarded key-ring update path, and keep previous DEKs in the key ring for read access.

#### Scenario: Compact session rotates before preparing snapshot

- **WHEN** the sync engine starts a compact session
- **AND** the current key-ring revision is less than or equal to the maximum key-ring revision represented by rows covered by the compact basis
- **THEN** the browser SHALL generate a new random DEK
- **AND** the browser SHALL add the new DEK to the plaintext key-ring `deks` map without removing existing DEKs
- **AND** the browser SHALL set `activeDekId` to the new DEK id
- **AND** the browser SHALL update the encrypted key-ring profile using the current revision as the revision precondition
- **AND** the browser SHALL prepare the compact snapshot only after the key-ring update succeeds

#### Scenario: Existing newer revision is reused

- **WHEN** the sync engine starts or restarts a compact session
- **AND** the current key-ring revision is greater than the maximum key-ring revision represented by rows covered by the compact basis
- **THEN** the browser SHALL NOT rotate the key ring again for that compact session
- **AND** the browser SHALL prepare the compact snapshot using the current active DEK and current key-ring revision

### Requirement: Concurrent rotation conflict joins the latest key ring

The system SHALL handle key-ring revision conflicts during automatic compaction rotation by abandoning the locally generated DEK, refetching the latest key-ring profile, and using the latest active DEK when it is newer than the compact basis. The browser SHALL NOT automatically retry its abandoned generated DEK after a rotation conflict.

#### Scenario: Another client rotates first

- **WHEN** a browser attempts automatic compaction rotation with a stale `currentRevision`
- **AND** the backend rejects the key-ring update with a revision conflict
- **THEN** the browser SHALL refetch the latest key-ring profile
- **AND** the browser SHALL abandon the locally generated DEK from the rejected request
- **AND** the browser SHALL use the refetched active DEK and revision if that revision is newer than the compact basis revision
- **AND** the browser SHALL NOT immediately create another automatic rotation for the same compact basis

### Requirement: Unlocked key ring exposes DEKs by id

The system SHALL expose enough decrypted key-ring material to encrypted app code to retrieve a DEK by id for read operations while still exposing the active DEK id for write operations. Plaintext DEK material SHALL remain in memory only for the current unlocked app session.

#### Scenario: Sync decrypts old rows after rotation

- **WHEN** the key ring contains multiple DEKs
- **AND** a pulled sync row references a previous DEK id in `encryptionKeyId`
- **THEN** the sync engine SHALL retrieve that DEK by id from the unlocked key-ring material
- **AND** the sync engine SHALL use that DEK to decrypt the row
- **AND** the sync engine SHALL continue using the active DEK id for new uploads

### Requirement: Key-ring ciphertext size is bounded

The backend SHALL reject key-ring setup and update requests whose encrypted key-ring ciphertext exceeds the configured key-ring ciphertext size limit. The limit SHALL apply to ciphertext bytes after base64 decoding and SHALL prevent unbounded growth of retained DEKs.

#### Scenario: Oversized key-ring update is rejected

- **WHEN** an authenticated client submits a key-ring update whose decoded key-ring ciphertext exceeds the configured limit
- **THEN** the backend SHALL reject the request with a validation or payload-too-large error
- **AND** the backend SHALL NOT update the stored key-ring row
- **AND** the previous active DEK and revision SHALL remain authoritative for sync writes

#### Scenario: Valid retained-DEK key ring is accepted

- **WHEN** an authenticated client submits a key-ring update that adds a DEK and whose decoded key-ring ciphertext is within the configured limit
- **AND** the supplied `currentRevision` matches the stored key-ring revision
- **THEN** the backend SHALL accept the update
- **AND** the backend SHALL store the new active DEK id, incremented revision, IV, and ciphertext

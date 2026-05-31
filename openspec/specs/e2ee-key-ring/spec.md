# e2ee-key-ring Specification

## Purpose

TBD - created by archiving change key-ring. Update Purpose after archive.

## Requirements

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

### Requirement: Key ring cache stores encrypted profile only

The system SHALL cache only the encrypted key-ring profile locally. The cache SHALL contain encrypted key-ring metadata/ciphertext and active wrapper metadata/ciphertext, and SHALL NOT contain plaintext MEK, plaintext DEK, or plaintext key-ring JSON. The durable offline cache SHALL be the service-worker-cached `GET /api/e2ee/key-ring` response rather than `key_ring` and `wrapper` IndexedDB object stores.

The `cacheKeyRingProfile` helper SHALL update both the React Query cache for the active tab and the named service-worker runtime cache so the Workbox NetworkFirst fallback stays warm for offline use. The `keyRingProfileQueryOptions(userId)` factory SHALL scope the query key per authenticated user.

The E2EE IndexedDB database SHALL NOT maintain remote encrypted `key_ring` or password `wrapper` object stores. It SHALL keep only local unlock material such as `local_wrapper` records.

#### Scenario: Successful fetch or mutation seeds encrypted runtime cache

- **WHEN** the backend returns a successful key-ring profile response from `GET /api/e2ee/key-ring`
- **OR** a mutation (setup, unlock, password change) produces an updated key-ring profile
- **THEN** the app SHALL update the React Query key-ring cache via `cacheKeyRingProfile`
- **AND** the app SHALL seed the named key-ring service-worker runtime cache via `cacheKeyRingProfile`
- **AND** the app SHALL NOT write the encrypted key-ring record to a `key_ring` IndexedDB object store
- **AND** the app SHALL NOT write the password wrapper fields to a `wrapper` IndexedDB object store

#### Scenario: Network-unavailable unlock may use encrypted runtime cache

- **WHEN** the backend key-ring endpoint is unavailable due to offline or network failure
- **AND** a cached successful `GET /api/e2ee/key-ring` response exists in the service-worker key-ring runtime cache
- **THEN** the shared key-ring query (`networkMode: 'offlineFirst'`) SHALL receive the cached response from the service worker
- **AND** the user SHALL still provide the encryption password to unwrap the MEK if no LDK or PIN local wrapper is present

#### Scenario: Non-network backend results do not fall back to stale app IndexedDB cache

- **WHEN** the backend key-ring request returns an authentication, not-found, conflict, validation, or contract error
- **THEN** the system SHALL NOT use a removed local encrypted IndexedDB key-ring cache as a fallback for that result
- **AND** the encryption gate SHALL dispatch a `check-failed` or `check-missing` action rather than attempting to read stale local records

#### Scenario: Password wrapper is not persisted in IndexedDB after first unlock

- **WHEN** the user successfully unlocks encryption with a password
- **THEN** the system SHALL NOT persist the server password wrapper fields into a `wrapper` IndexedDB store
- **AND** subsequent offline unlock attempts SHALL obtain encrypted profile and wrapper data from the service-worker-cached key-ring GET response or fail if unavailable

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

After a successful password change, the client SHALL refetch the key-ring profile through the shared key-ring fetch path (`queryClient.fetchQuery` with `staleTime: 0`) so the React Query cache and service-worker runtime cache observe the new active password wrapper. After successful mutations (setup, unlock with new profile), the client SHALL seed the key-ring cache via `cacheKeyRingProfile`.

#### Scenario: Successful change refreshes cached server wrapper

- **WHEN** the change-password endpoint returns success
- **THEN** the client SHALL request the latest key-ring profile
- **AND** the client SHALL update the shared key-ring query data from the fetched profile
- **AND** the service worker SHALL be able to update the named key-ring runtime cache from the successful GET response
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

The system SHALL expose enough decrypted key-ring material to encrypted app code to retrieve a DEK by id for read operations while still exposing the active DEK id for write operations. Plaintext DEK material SHALL remain in memory only for the current unlocked app session. Each DEK entry in memory SHALL carry `key`, `createdAt`, and `retiredAt` fields.

#### Scenario: Sync decrypts old rows after rotation

- **WHEN** the key ring contains multiple DEKs
- **AND** a pulled sync row references a previous DEK id in `encryptionKeyId`
- **THEN** the sync engine SHALL retrieve that DEK's raw key bytes from `deks[encryptionKeyId].key` in the unlocked key-ring material
- **AND** the sync engine SHALL use that DEK to decrypt the row
- **AND** the sync engine SHALL continue using the active DEK id for new uploads

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

### Requirement: Key-ring endpoints enforce bounded request and stored blob sizes

The backend SHALL bound key-ring and password-wrapper payloads at the request, base64 field, decoded byte, and database row layers. Key-ring mutation endpoints under `/api/e2ee/*` SHALL reject request bodies that exceed the configured E2EE body limit before JSON parsing. Base64 fields with known decoded limits SHALL be rejected before decoding when they are too long to fit those limits. The database SHALL reject key-ring and wrapper rows whose encrypted blob sizes do not satisfy the shared size constants.

#### Scenario: Oversized key-ring setup body is rejected before JSON parsing

- **WHEN** an authenticated `POST /api/e2ee/key-ring` request body exceeds the configured E2EE body limit
- **THEN** the backend SHALL reject the request with HTTP 413 before parsing the body as JSON
- **AND** the backend SHALL NOT create key-ring or wrapper rows

#### Scenario: Oversized key-ring update body is rejected before JSON parsing

- **WHEN** an authenticated `PUT /api/e2ee/key-ring` request body exceeds the configured E2EE body limit
- **THEN** the backend SHALL reject the request with HTTP 413 before parsing the body as JSON
- **AND** the backend SHALL NOT update the key-ring row

#### Scenario: Oversized password change body is rejected before JSON parsing

- **WHEN** an authenticated `POST /api/e2ee/key-ring/change-password` request body exceeds the configured E2EE body limit
- **THEN** the backend SHALL reject the request with HTTP 413 before parsing the body as JSON
- **AND** the backend SHALL NOT revoke or insert password wrapper rows

#### Scenario: Oversized key-ring ciphertext string is rejected before base64 decode

- **WHEN** a key-ring setup or update request contains a key-ring `ciphertext` base64 string that cannot decode within the configured key-ring ciphertext byte limit
- **THEN** the backend SHALL reject the request as invalid before decoding that field
- **AND** the backend SHALL NOT persist the submitted ciphertext

#### Scenario: Oversized wrapper fields are rejected before base64 decode

- **WHEN** a key-ring setup or password change request contains `kdfSalt` or wrapped MEK `ciphertext` base64 strings that cannot decode to their configured fixed byte lengths
- **THEN** the backend SHALL reject the request as invalid before decoding those fields
- **AND** the backend SHALL NOT persist the submitted wrapper

#### Scenario: Key-ring database constraints reject oversized encrypted blobs

- **WHEN** code attempts to persist a `key_ring` row whose `ciphertext` byte length exceeds the configured key-ring ciphertext byte limit
- **THEN** the database SHALL reject the write

#### Scenario: Wrapper database constraints reject incorrect fixed-size blobs

- **WHEN** code attempts to persist a `key_ring_wrapping` row whose `kdf_salt` or `ciphertext` byte length does not equal the configured fixed byte length for that field
- **THEN** the database SHALL reject the write

### Requirement: Key-ring fetches share a query cache

The encryption gate and unlock flows SHALL fetch the key-ring profile through a shared React Query query (`keyRingProfileQueryOptions(userId)`) so a recent successful gate check can be reused during unlock without a duplicate GET. The query SHALL use a bounded freshness window (five minutes), `networkMode: 'offlineFirst'`, and a userId-scoped query key (`['key-ring-profile', userId]`). The query preserves the service-worker NetworkFirst cache as the durable offline fallback after reload. After successful mutations, `cacheKeyRingProfile` SHALL update both the React Query cache and the named service-worker runtime cache.

#### Scenario: Unlock reuses recent gate key-ring fetch

- **WHEN** the encryption gate recently fetched the key-ring profile successfully
- **AND** the user submits the unlock form within the key-ring query freshness window
- **THEN** unlock SHALL use the cached query data without issuing a duplicate network GET

#### Scenario: Reloaded offline unlock uses service-worker cache

- **WHEN** the app reloads while offline
- **AND** the in-memory query cache is empty
- **AND** the service worker has a cached successful key-ring profile response
- **THEN** the shared key-ring fetch path SHALL be able to receive the cached response from the service worker

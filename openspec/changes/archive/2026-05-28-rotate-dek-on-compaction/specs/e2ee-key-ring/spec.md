## ADDED Requirements

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

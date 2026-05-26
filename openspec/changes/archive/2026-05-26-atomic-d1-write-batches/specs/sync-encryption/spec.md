## MODIFIED Requirements

### Requirement: Encryption key id is sent with every upload

Every push and compact request body SHALL include the `encryptionKeyId` field identifying which DEK was used to encrypt the blob. The server SHALL reject writes where `encryptionKeyId` does not match the authenticated user's key-ring `activeDekId`, and this active-key precondition SHALL be enforced at write time so a concurrent key change cannot race a later sync row insert.

#### Scenario: Push body includes active DEK id

- **WHEN** the sync engine sends a push request
- **THEN** the JSON body SHALL include `encryptionKeyId` matching the active DEK id from the unlocked key ring
- **AND** the server SHALL reject the push if `encryptionKeyId` does not match the authenticated user's stored `activeDekId`
- **AND** the server SHALL enforce the active-DEK check in the database write path rather than relying only on an earlier read

#### Scenario: Compact body includes active DEK id

- **WHEN** the sync engine sends a compact request
- **THEN** the JSON body SHALL include `encryptionKeyId` matching the active DEK id from the unlocked key ring
- **AND** the server SHALL reject the compact request if `encryptionKeyId` does not match the authenticated user's stored `activeDekId`
- **AND** the server SHALL enforce the active-DEK check in the database write path rather than relying only on an earlier read

## ADDED Requirements

### Requirement: Sync push writes are atomic and idempotent

The backend SHALL persist sync push rows with database-guarded atomic behavior that preserves the existing idempotency contract.

#### Scenario: Push insert uses current active key

- **WHEN** an authenticated client pushes an encrypted update with a new sync record id
- **THEN** the backend SHALL insert the sync record only if the submitted `encryptionKeyId` is still the authenticated user's active DEK at write time
- **AND** the backend SHALL rollback the push write if the active-key precondition fails during the batch

#### Scenario: Duplicate push id keeps idempotency behavior

- **WHEN** an authenticated client pushes with a sync record id that already exists for that user
- **AND** the submitted encryption metadata and ciphertext match the existing row
- **THEN** the backend SHALL treat the request as idempotent success
- **AND** the backend SHALL reject the request as an idempotency conflict when the existing row differs

### Requirement: Sync compact writes are atomic

The backend SHALL persist sync compaction mutations atomically so snapshot insertion and covered-row cleanup cannot partially persist on conflict or storage failure.

#### Scenario: Compact inserts snapshot and deletes covered rows atomically

- **WHEN** an authenticated client submits a valid compact request
- **THEN** the backend SHALL insert the compact snapshot and delete the covered sync rows in one D1 batch
- **AND** the backend SHALL rollback the entire compact mutation if any required compact precondition or write fails

#### Scenario: Compact conflict preserves previous sync rows

- **WHEN** a compact request fails because its head, idempotency, storage, or active-key precondition is stale or invalid
- **THEN** the backend SHALL NOT leave a compact snapshot without the corresponding cleanup
- **AND** the backend SHALL NOT delete covered rows without a committed compact snapshot

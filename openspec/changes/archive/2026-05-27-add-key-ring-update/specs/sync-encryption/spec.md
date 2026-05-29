## ADDED Requirements

### Requirement: Active DEK updates act as sync write barriers

The server SHALL treat the stored key-ring `activeDekId` as the write-time authority for encrypted sync uploads. After a key-ring update changes `activeDekId`, sync push and compact requests encrypted with a previous active DEK SHALL be rejected by the existing active-key precondition.

#### Scenario: Previous active DEK cannot write after key-ring update

- **WHEN** a key-ring update changes the authenticated user's stored `activeDekId`
- **AND** a later sync push or compact request submits `encryptionKeyId` equal to the previous active DEK id
- **THEN** the backend SHALL reject the sync write using the existing active-key mismatch behavior
- **AND** the backend SHALL NOT persist a sync row encrypted with the previous active DEK after the key-ring update commits

#### Scenario: Old DEKs remain readable until compacted away

- **WHEN** sync records encrypted with a previous DEK still exist
- **AND** the key-ring active DEK changes to a new DEK
- **THEN** clients SHALL be able to decrypt existing records by looking up each record's `encryptionKeyId` in the unlocked key-ring DEK map
- **AND** key-ring update SHALL NOT require sync compaction to succeed in the same request

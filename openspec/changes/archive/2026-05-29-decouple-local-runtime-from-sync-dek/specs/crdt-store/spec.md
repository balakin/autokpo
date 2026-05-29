## MODIFIED Requirements

### Requirement: IndexedDB cache contents are encrypted

The system SHALL persist Yjs update bytes in IndexedDB only as AES-256-GCM encrypted envelopes using a dedicated local persistence DEK, distinct from the remote sync DEK. Each envelope SHALL include `schemaVersion: 1`, `kind: "update" | "snapshot"`, generated `id`, `encryptionAlgorithm: "aes-256-gcm"`, `encryptionVersion: 1`, `encryptionKeyId`, a random 12-byte `iv`, and `ciphertext`. AES-GCM AAD SHALL be the UTF-8 encoding of `autokpo:yjs-indexeddb:v1:<dbName>:updates:<kind>:<id>:<keyId>`.

The local CRDT runtime and encrypted IndexedDB persistence lifecycle SHALL depend on the opened user id and MEK needed to unwrap local persistence keys. The lifecycle SHALL NOT depend on the remote sync active DEK id or active DEK bytes. Remote sync key-ring rotations SHALL update sync encryption state without destroying or recreating the local Y.Doc runtime.

#### Scenario: Yjs update is stored as ciphertext

- **WHEN** the system explicitly persists a local or pulled remote Yjs update
- **THEN** the system SHALL encrypt the update bytes using the active local persistence DEK
- **AND** SHALL append only the encrypted envelope to the IndexedDB `updates` store
- **AND** SHALL NOT use the remote sync DEK for the local IndexedDB row

#### Scenario: Remote sync DEK rotation does not recreate local runtime

- **WHEN** the remote sync key-ring active DEK id changes while the user id and MEK remain unchanged
- **THEN** the local Y.Doc runtime and encrypted IndexedDB persistence SHALL remain mounted
- **AND** the local IndexedDB database SHALL NOT be destroyed and reopened solely because of that remote sync DEK change
- **AND** the sync engine SHALL still use the updated remote sync key material for later remote sync operations

#### Scenario: MEK change recreates local runtime

- **WHEN** the MEK for the opened user changes
- **THEN** the local Y.Doc runtime SHALL be recreated so encrypted IndexedDB persistence can unwrap local persistence keys with the current MEK

#### Scenario: Unsupported encrypted cache envelope is rejected

- **WHEN** IndexedDB contains an update envelope with an unsupported `schemaVersion`, `kind`, `encryptionAlgorithm`, or `encryptionVersion`
- **THEN** the system SHALL NOT apply that row's ciphertext to the Y.Doc
- **AND** SHALL treat the local cache as absent or broken

#### Scenario: AAD binds cache ciphertext to database, row, kind, and key

- **WHEN** a cache ciphertext encrypted for one database name, envelope id, envelope kind, or encryption key id is decrypted using AAD for another database name, envelope id, envelope kind, or key id
- **THEN** AES-GCM authentication SHALL fail
- **AND** the system SHALL treat the local cache as absent or broken

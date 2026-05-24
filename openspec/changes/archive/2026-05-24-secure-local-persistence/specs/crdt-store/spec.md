## MODIFIED Requirements

### Requirement: IndexedDB cache contents are encrypted

The system SHALL persist Yjs update bytes in IndexedDB only as AES-256-GCM encrypted envelopes using a dedicated local persistence DEK, distinct from the remote sync DEK. Each envelope SHALL include `schemaVersion: 1`, `kind: "update" | "snapshot"`, generated `id`, `encryptionAlgorithm: "aes-256-gcm"`, `encryptionVersion: 1`, `encryptionKeyId`, a random 12-byte `iv`, and `ciphertext`. AES-GCM AAD SHALL be the UTF-8 encoding of `autokpo:yjs-indexeddb:v1:<dbName>:updates:<kind>:<id>:<keyId>`.

#### Scenario: Yjs update is stored as ciphertext

- **WHEN** the system explicitly persists a local or pulled remote Yjs update
- **THEN** the system SHALL encrypt the update bytes using the active local persistence DEK
- **AND** SHALL append only the encrypted envelope to the IndexedDB `updates` store
- **AND** SHALL NOT use the remote sync DEK for the local IndexedDB row

#### Scenario: Unsupported encrypted cache envelope is rejected

- **WHEN** IndexedDB contains an update envelope with an unsupported `schemaVersion`, `kind`, `encryptionAlgorithm`, or `encryptionVersion`
- **THEN** the system SHALL NOT apply that row's ciphertext to the Y.Doc
- **AND** SHALL treat the local cache as absent or broken

#### Scenario: AAD binds cache ciphertext to database, row, kind, and key

- **WHEN** a cache ciphertext encrypted for one database name, envelope id, envelope kind, or encryption key id is decrypted using AAD for another database name, envelope id, envelope kind, or key id
- **THEN** AES-GCM authentication SHALL fail
- **AND** the system SHALL treat the local cache as absent or broken

### Requirement: Cross-tab Y.Doc fan-out via BroadcastChannel and IndexedDB

The system SHALL propagate Yjs update bytes between tabs of the same origin so that an edit made in one tab is reflected in all other open tabs. Live open-tab propagation SHALL use `BroadcastChannel` for low-latency UI updates, while encrypted IndexedDB persistence SHALL provide durable startup/reload recovery. BroadcastChannel-applied updates SHALL be memory-only in receiving tabs and SHALL NOT be persisted again by those tabs. The system SHALL accept that idempotent `Y.applyUpdate` makes duplicate delivery safe.

#### Scenario: Edit in tab B appears in tab C

- **WHEN** the user edits an entry in tab B while tabs A (leader) and C are also open
- **THEN** tab B SHALL explicitly persist the resulting Yjs update bytes to encrypted IndexedDB persistence
- **AND** tabs A and C SHALL apply the resulting Yjs update bytes from BroadcastChannel in memory
- **AND** subscribed components in those tabs SHALL re-render to reflect the change

#### Scenario: Origin tag prevents echo loops

- **WHEN** a tab receives Yjs update bytes from `BroadcastChannel` or from a server fetch and applies them
- **THEN** the application SHALL call `Y.applyUpdate` with an origin ignored by local dirty/broadcast side effects
- **AND** the update event listener SHALL ignore updates whose origin represents BroadcastChannel or remote replay

#### Scenario: Persistence replays do not re-persist themselves

- **WHEN** encrypted IndexedDB persistence decrypts and applies cached Yjs update bytes to the document during startup
- **THEN** the application SHALL apply those bytes with an origin ignored by local persistence side effects
- **AND** SHALL NOT persist those replayed updates again

#### Scenario: Broadcast echo is not redundantly persisted

- **WHEN** tab C receives a BroadcastChannel update that originated from tab B
- **THEN** tab C SHALL apply the update to its in-memory Y.Doc
- **AND** tab C SHALL NOT append that update to encrypted IndexedDB persistence

### Requirement: IndexedDB update log compaction

The system SHALL compact the encrypted IndexedDB update log after 500 stored updates by writing an encrypted full Yjs snapshot and deleting older update rows. Compaction SHALL rotate the local persistence DEK and SHALL commit the new active local key, compacted snapshot, and deletion of covered update rows in a single IndexedDB readwrite transaction. Compaction SHALL preserve the current Y.Doc state while reducing future startup replay work.

#### Scenario: Update log reaches compaction threshold

- **WHEN** encrypted IndexedDB persistence reaches 500 stored updates
- **THEN** the system SHALL encode the current Y.Doc state as a full Yjs update
- **AND** SHALL generate and MEK-wrap a new local persistence DEK
- **AND** SHALL encrypt the snapshot with the new local persistence DEK
- **AND** SHALL commit the new active local key, append the encrypted snapshot, and delete older update rows that are covered by the snapshot in one IndexedDB transaction

#### Scenario: Compacted cache rehydrates equivalent document state

- **WHEN** the application restarts after IndexedDB compaction
- **THEN** encrypted persistence SHALL decrypt and apply the remaining update rows using the active local persistence DEK
- **AND** the hydrated Y.Doc state SHALL match the state that existed when compaction completed plus any later persisted updates

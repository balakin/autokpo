## ADDED Requirements

### Requirement: IndexedDB cache contents are encrypted

The system SHALL persist Yjs update bytes in IndexedDB only as AES-256-GCM encrypted envelopes. Each envelope SHALL include `schemaVersion: 1`, `encryptionAlgorithm: "aes-256-gcm"`, `encryptionVersion: 1`, `encryptionKeyId`, a random 12-byte `iv`, and `ciphertext`. AES-GCM AAD SHALL be the UTF-8 encoding of `autokpo:yjs-indexeddb:v1:<dbName>:updates:<keyId>`.

#### Scenario: Yjs update is stored as ciphertext

- **WHEN** the Y.Doc emits an update that did not originate from the IndexedDB persistence instance
- **THEN** the system SHALL encrypt the update bytes using the unlocked session master key
- **AND** SHALL append only the encrypted envelope to the IndexedDB `updates` store

#### Scenario: Unsupported encrypted cache envelope is rejected

- **WHEN** IndexedDB contains an update envelope with an unsupported `schemaVersion`, `encryptionAlgorithm`, or `encryptionVersion`
- **THEN** the system SHALL NOT apply that row's ciphertext to the Y.Doc
- **AND** SHALL treat the local cache as absent

#### Scenario: AAD binds cache ciphertext to database and key

- **WHEN** a cache ciphertext encrypted for one database name or encryption key id is decrypted using AAD for another database name or key id
- **THEN** AES-GCM authentication SHALL fail
- **AND** the system SHALL treat the local cache as absent

## MODIFIED Requirements

### Requirement: Single Yjs document for application state

The system SHALL store all cross-device application state — books, entries, per-book entity profiles, per-book signatures, and the user's locale — in a single Yjs document persisted to IndexedDB through app-owned encrypted persistence. Theme preference SHALL remain in `localStorage` as a per-device setting and SHALL NOT be part of the Y.Doc.

#### Scenario: Y.Doc structure on first start

- **WHEN** the application boots for the first time on a device with no prior IndexedDB state
- **THEN** the system creates a Y.Doc containing top-level Y.Maps named `meta`, `user`, and `books`, sets `meta.schemaVersion = 1` and `meta.createdAt` to the current ISO timestamp, and persists it to IndexedDB as encrypted Yjs update data

#### Scenario: Locale defaulted on first start

- **WHEN** the Y.Doc has no `user.locale` value after IndexedDB has finished syncing
- **THEN** the system sets `user.locale` to the `initialLocale` value (the locale stored in `localStorage` at mount time, which may reflect `navigator.language` for brand-new devices)

#### Scenario: Theme remains in localStorage

- **WHEN** the user changes the theme preference
- **THEN** the value is written to `localStorage` under `autokpo:theme` and is NOT written to the Y.Doc

#### Scenario: Books are stored as a Y.Map keyed by book id

- **WHEN** a book is created
- **THEN** an entry is added to the `books` Y.Map under the book's UUID, whose value is a Y.Map containing `id`, `year`, `createdAt`, `favorite`, optional `profile` (Y.Map) and `signature` (Y.Map), and an `entries` Y.Array of Y.Map entries

#### Scenario: Concurrent edits to different fields of the same entry merge per field

- **WHEN** two devices, while disconnected, edit two different fields of the same KPO entry (e.g. one edits `opisPrometa`, the other edits `odProdajeProizvoda`) and then both come online
- **THEN** the merged entry retains both edits because each field lives on a Y.Map and Yjs resolves the merge field by field

### Requirement: IndexedDB persistence and bootstrap order

The system SHALL await encrypted IndexedDB persistence readiness before mounting the React tree, so the first render reads from a fully hydrated Y.Doc and never flashes empty state. After persistence readiness resolves, the system SHALL call `bootstrap(ydoc, initialLocale)` where `initialLocale` is the locale currently stored in `localStorage` (read by `CrdtProvider` before the doc is ready). `bootstrap()` SHALL seed `user.locale` with `initialLocale` only if the field is absent — existing accounts are unaffected.

#### Scenario: Hydration completes before render

- **WHEN** the application starts and IndexedDB contains prior encrypted Y.Doc state
- **THEN** the React tree mounts only after persistence has finished loading and the document reflects the decrypted persisted content on the first render

#### Scenario: Locale defaulted on first start from device language

- **WHEN** the Y.Doc has no `user.locale` value after IndexedDB has finished syncing
- **THEN** the system SHALL set `user.locale` to the `initialLocale` value passed to `bootstrap()`
- **AND** `initialLocale` SHALL be the locale stored in `localStorage` at mount time (which may reflect `navigator.language` for brand-new devices)

#### Scenario: Existing account locale is not overwritten

- **WHEN** the Y.Doc already has a `user.locale` value after IndexedDB has finished syncing
- **THEN** `bootstrap()` SHALL NOT modify `user.locale`
- **AND** `LocaleSynchronizer` SHALL sync the existing CRDT locale to `localStorage` on mount

#### Scenario: Invalid encrypted cache starts empty

- **WHEN** encrypted IndexedDB persistence cannot open, read, parse, or decrypt the local cache
- **THEN** the system SHALL treat the cache as absent
- **AND** SHALL delete the cache if possible
- **AND** SHALL continue startup with an empty local cache

### Requirement: Cross-tab Y.Doc fan-out via BroadcastChannel and IndexedDB

The system SHALL propagate Yjs update bytes between tabs of the same origin so that an edit made in one tab is reflected in all other open tabs. Live open-tab propagation SHALL use `BroadcastChannel` for low-latency UI updates, while encrypted IndexedDB persistence SHALL provide durable startup/reload recovery. The system SHALL accept that idempotent `Y.applyUpdate` makes duplicate delivery safe.

#### Scenario: Edit in tab B appears in tab C

- **WHEN** the user edits an entry in tab B while tabs A (leader) and C are also open
- **THEN** tabs A and C apply the resulting Yjs update bytes and any subscribed components in those tabs re-render to reflect the change

#### Scenario: Origin tag prevents echo loops

- **WHEN** a tab receives Yjs update bytes from `BroadcastChannel` or from a server fetch and applies them
- **THEN** the application calls `Y.applyUpdate(doc, bytes, REMOTE_ORIGIN)` where `REMOTE_ORIGIN` is a module-private `Symbol('autokpo:remote')` exported from `src/crdt/sync-logic.ts`, and its update event listener ignores updates whose origin is `REMOTE_ORIGIN`

#### Scenario: Persistence replays do not re-persist themselves

- **WHEN** encrypted IndexedDB persistence decrypts and applies cached Yjs update bytes to the document during startup
- **THEN** the persistence update listener SHALL ignore those replayed updates by origin
- **AND** SHALL continue to persist later local and remote sync updates whose origin is not the persistence instance

### Requirement: IndexedDB update log compaction

The system SHALL compact the encrypted IndexedDB update log after 500 stored updates by writing an encrypted full Yjs snapshot and deleting older update rows. Compaction SHALL preserve the current Y.Doc state while reducing future startup replay work.

#### Scenario: Update log reaches compaction threshold

- **WHEN** encrypted IndexedDB persistence reaches 500 stored updates
- **THEN** the system SHALL encode the current Y.Doc state as a full Yjs update
- **AND** SHALL encrypt and append that snapshot to the `updates` store
- **AND** SHALL delete older update rows that are covered by the snapshot

#### Scenario: Compacted cache rehydrates equivalent document state

- **WHEN** the application restarts after IndexedDB compaction
- **THEN** encrypted persistence SHALL decrypt and apply the remaining update rows
- **AND** the hydrated Y.Doc state SHALL match the state that existed when compaction completed plus any later persisted updates

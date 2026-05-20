## MODIFIED Requirements

### Requirement: Single Yjs document for application state

The system SHALL store all cross-device application state — books, entries, per-book entity profiles, per-book signatures, and the user's locale — in a single Yjs document per signed-in user, persisted to a user-scoped IndexedDB database via `y-indexeddb`. Theme preference SHALL remain in `localStorage` as a per-device setting and SHALL NOT be part of the Y.Doc.

#### Scenario: Signed-in session creates a user-scoped Y.Doc runtime

- **WHEN** auth state becomes `signed_in` for user `U`
- **THEN** the application creates one Y.Doc runtime for `U`
- **AND** it persists that document in a user-scoped IndexedDB database for `U`

#### Scenario: Signed-out state has no active Y.Doc runtime

- **WHEN** auth state is `signed_out`
- **THEN** the application SHALL NOT keep an active signed-in Y.Doc runtime mounted

#### Scenario: Theme remains in localStorage

- **WHEN** the user changes the theme preference
- **THEN** the value is written to `localStorage` under `autokpo:theme`
- **AND** it is NOT written to the Y.Doc

### Requirement: IndexedDB persistence and bootstrap order

The system SHALL await `y-indexeddb` hydration before mounting the signed-in React subtree for a user, so the first signed-in render reads from a fully hydrated Y.Doc and never flashes empty state. Signed-out UI SHALL remain mountable without waiting for CRDT hydration.

#### Scenario: Signed-out UI does not wait for CRDT hydration

- **WHEN** the application boots without a session
- **THEN** it renders signed-out UI without creating or waiting for a Y.Doc persistence provider

#### Scenario: Signed-in subtree hydrates before first signed-in render

- **WHEN** auth state becomes `signed_in` and IndexedDB contains prior Y.Doc state for that user
- **THEN** the signed-in subtree mounts only after persistence has finished loading and the document reflects the persisted content on the first signed-in render

### Requirement: Sync state side-channel in localStorage

The system SHALL persist sync metadata (cursor, state vector, dirty flag, last successful sync timestamp) in `localStorage` under a user-scoped key derived from the authenticated user id, entirely separate from the Y.Doc. This side-channel stores per-device relationship-to-server state that is meaningless when merged across devices.

The stored state SHALL contain:

- `cursor: number` — the last server sequence number successfully applied (0 means "fresh")
- `stateVector: string | null` — base64-encoded `Y.encodeStateVector(doc)`, or `null` until the first successful push ack
- `dirty: boolean` — whether local changes exist that haven't been pushed yet (handles delete-only edits that don't advance the state vector)
- `lastSuccessfulSyncAt: number | null` — Unix epoch milliseconds for the most recent successful sync acknowledgement on this device, or `null` until one has occurred

Operations:

- `read() → { cursor, stateVector (Uint8Array | null), dirty, lastSuccessfulSyncAt }` — parses JSON, decodes base64 stateVector
- `write({ cursor, stateVector, dirty, lastSuccessfulSyncAt })` — encodes stateVector to base64, stringifies, single `localStorage.setItem`
- `markDirty()` — reads current state, sets `dirty: true`, preserves cursor, stateVector, and `lastSuccessfulSyncAt`
- `reset()` — sets `cursor: 0`, `stateVector: null`, preserves `dirty` and `lastSuccessfulSyncAt` (used on 410 Gone recovery so pending local edits are still pushed)

Writing the sync metadata as one JSON object in one `setItem` gives transactional semantics for free — a crash between updating fields is impossible.

#### Scenario: Round-trip fidelity with sync timestamp

- **WHEN** `write({ cursor: 42, stateVector: sv, dirty: true, lastSuccessfulSyncAt: 1714567890000 })` is called and then `read()` is called for user `U`
- **THEN** the returned `cursor` is 42, `stateVector` is the same `Uint8Array`, `dirty` is `true`, and `lastSuccessfulSyncAt` is `1714567890000`

#### Scenario: Default state on fresh install for a user

- **WHEN** `read()` is called for user `U` and no user-scoped sync key exists in `localStorage`
- **THEN** the result is `{ cursor: 0, stateVector: null, dirty: false, lastSuccessfulSyncAt: null }`

## REMOVED Requirements

### Requirement: Web Locks leader election

**Reason**: Leader election becomes an app-level coordination capability shared by auth, sync, and cleanup rather than a CRDT-owned concern.
**Migration**: Use the `leader-coordination` capability for leader state and leader-owned side effects; CRDT consumers read that shared leader capability instead of importing a CRDT-specific leader module.

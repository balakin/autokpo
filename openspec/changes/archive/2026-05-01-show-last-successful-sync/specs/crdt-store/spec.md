## MODIFIED Requirements

### Requirement: Sync state side-channel in localStorage

The system SHALL persist sync metadata (cursor, state vector, dirty flag, last successful sync timestamp) in `localStorage` under the key `autokpo:sync` as a single JSON object, entirely separate from the Y.Doc. This side-channel stores per-device relationship-to-server state that is meaningless when merged across devices.

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

- **WHEN** `write({ cursor: 42, stateVector: sv, dirty: true, lastSuccessfulSyncAt: 1714567890000 })` is called and then `read()` is called
- **THEN** the returned `cursor` is 42, `stateVector` is the same `Uint8Array`, `dirty` is `true`, and `lastSuccessfulSyncAt` is `1714567890000`

#### Scenario: Reset preserves dirty flag and sync timestamp for 410 recovery

- **WHEN** the sync state has `cursor: 100, dirty: true, lastSuccessfulSyncAt: 1714567890000` and `reset()` is called
- **THEN** the state becomes `{ cursor: 0, stateVector: null, dirty: true, lastSuccessfulSyncAt: 1714567890000 }`

#### Scenario: Default state on fresh install

- **WHEN** `read()` is called and no `autokpo:sync` key exists in localStorage
- **THEN** the result is `{ cursor: 0, stateVector: null, dirty: false, lastSuccessfulSyncAt: null }`

### Requirement: Sync metadata is exposed through selector-based subscriptions

The system SHALL expose sync metadata to React through a selector-based subscription API built on `useSyncExternalStoreWithSelector`. The store SHALL notify subscribers after same-tab writes and after cross-tab `storage` events for the `autokpo:sync` key. Callers SHALL be able to select a shallow-friendly slice such as only `lastSuccessfulSyncAt` so unrelated sync metadata updates do not force re-renders.

#### Scenario: Same-tab sync-state writes notify subscribers

- **WHEN** code in the current tab writes updated sync state including a new `lastSuccessfulSyncAt`
- **THEN** components subscribed to sync metadata SHALL be notified without waiting for a browser `storage` event

#### Scenario: Cross-tab sync-state writes notify subscribers

- **WHEN** another tab updates `localStorage['autokpo:sync']`
- **THEN** components subscribed to sync metadata in this tab SHALL be notified via the browser `storage` event bridge

#### Scenario: Selector ignores unrelated sync metadata changes

- **WHEN** a component subscribes only to `lastSuccessfulSyncAt` and the sync state changes only in `cursor` or `dirty`
- **THEN** the component SHALL NOT re-render because the selected value remains equal

## ADDED Requirements

### Requirement: Successful sync acknowledgements stamp the sync timestamp

The system SHALL update `lastSuccessfulSyncAt` only after a successful pull response or after a contiguous push or compact acknowledgement where `prevHead === cursor`. Gap-detected push or compact responses SHALL NOT stamp the timestamp directly; they SHALL wait for the subsequent pull reconciliation to succeed.

#### Scenario: Pull stamps timestamp even when no records changed

- **WHEN** the leader completes a successful pull response, including a `304 Not Modified` response
- **THEN** the sync state SHALL record the current time in `lastSuccessfulSyncAt`

#### Scenario: Contiguous push stamps timestamp

- **WHEN** a push succeeds and `prevHead === cursor`
- **THEN** the sync state SHALL record the current time in `lastSuccessfulSyncAt`

#### Scenario: Gap-detected push does not stamp timestamp directly

- **WHEN** a push succeeds but `prevHead > cursor`
- **THEN** the engine SHALL invalidate pull reconciliation instead of recording `lastSuccessfulSyncAt` in that push path

#### Scenario: Contiguous compact stamps timestamp

- **WHEN** a compact succeeds and `prevHead === cursor`
- **THEN** the sync state SHALL record the current time in `lastSuccessfulSyncAt`

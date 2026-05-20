## MODIFIED Requirements

### Requirement: Sync state side-channel in localStorage

The system SHALL persist sync metadata in `localStorage` under a per-user key `autokpo:sync:<userId>`, entirely separate from the Y.Doc. This side-channel stores per-device relationship-to-server state that is meaningless when merged across devices.

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

The app SHALL also store the remembered local user id separately so startup can decide which per-user sync key and IndexedDB document to reopen.

#### Scenario: Per-user sync state round-trips correctly

- **WHEN** `write({ cursor: 42, stateVector: sv, dirty: true, lastSuccessfulSyncAt: 1714567890000 })` is called for user `u1` and then `read()` is called for user `u1`
- **THEN** the returned `cursor` is 42, `stateVector` is the same `Uint8Array`, `dirty` is `true`, and `lastSuccessfulSyncAt` is `1714567890000`

#### Scenario: Different users use different sync metadata keys

- **WHEN** the device has local state for users `u1` and `u2`
- **THEN** each user's sync metadata is stored under a different `autokpo:sync:<userId>` key

#### Scenario: Reset preserves dirty flag and sync timestamp for 410 recovery

- **WHEN** the sync state has `cursor: 100, dirty: true, lastSuccessfulSyncAt: 1714567890000` and `reset()` is called
- **THEN** the state becomes `{ cursor: 0, stateVector: null, dirty: true, lastSuccessfulSyncAt: 1714567890000 }`

### Requirement: Pull protocol (GET with ETag and binary stream)

The system SHALL pull updates from the server using `GET /api/sync` with an `If-None-Match` header containing the current cursor and an `X-Local-User-Id` header containing the currently opened local user id. There is no `?since=` query parameter.

- On `200`: apply all records to the Y.Doc using `applyRecordsToDoc()` (from `src/crdt/sync-logic.ts`, which wraps them in a single `ydoc.transact()` with `REMOTE_ORIGIN`), then post each record as `remote-update` on BroadcastChannel, write `syncState.write({ cursor: max(head, freshCursor), stateVector, dirty })` after the transact returns, and call `schedulePushIfPendingChanges()` to schedule a push if there are pending local edits.
- On `304`: nothing to do.
- On `401`: run the logout-and-wipe flow because the local cache is no longer backed by a valid session.
- On `409` with `local_user_mismatch`: run the logout-and-wipe flow because the local cache belongs to a different account than the current session.
- On `410`: call `syncState.reset()` (zeros cursor, nulls stateVector, preserves dirty) and rethrow. React Query retries immediately once (with cursor = 0, no `If-None-Match` header), pulling from scratch. The Y.Doc is NOT touched on 410 — local offline edits survive the subsequent merge.

#### Scenario: Pull sends the local-user header

- **WHEN** the leader issues `GET /api/sync` for local user `u1`
- **THEN** the request includes `X-Local-User-Id: u1`

#### Scenario: Unauthorized pull triggers logout cleanup

- **WHEN** the leader pull receives `401 unauthorized`
- **THEN** the app runs the logout-and-wipe flow instead of retrying the request as a transient sync failure

#### Scenario: Local-user mismatch pull triggers logout cleanup

- **WHEN** the leader pull receives `409` with error code `local_user_mismatch`
- **THEN** the app runs the logout-and-wipe flow instead of treating the error as a generic sync conflict

### Requirement: Push protocol (POST with idempotency key and push-as-poll)

The system SHALL push local changes using `POST /api/sync` with an `Idempotency-Key` header (a UUID generated per logical push, reused across retries) and an `X-Local-User-Id` header containing the currently opened local user id.

**Delta computation:** `computeDelta(doc, stateVector)` (exported from `src/crdt/sync-logic.ts`) returns `Y.encodeStateAsUpdate(doc)` (full state) if `stateVector` is `null` (post-410 recovery), otherwise `Y.encodeStateAsUpdate(doc, stateVector)` (the diff since the last-acked state vector).

**Dirty flag:** `hasPendingChanges(state)` (exported from `src/crdt/sync-logic.ts`) returns `true` if `stateVector === null || dirty === true`. The `dirty` flag is set by every local Y.Doc update and cleared after a contiguous push success. This handles delete-only edits that don't advance the state vector.

**Push debounce:** local changes schedule a push after `PUSH_DEBOUNCE_MS = 2000`; rapid edits within the debounce window coalesce into a single delta.

**Large delta fallback:** if `delta.byteLength > MAX_BLOB_BYTES` (1 MiB), the engine sends a compact (full snapshot) instead of a push.

**Push-as-poll contiguity check:** after push success, the engine computes `prevHead = assignedSeq - 1` (dense monotonic sequence). If `prevHead === cursor`, the push is contiguous — advance cursor, update stateVector, clear dirty. If `prevHead > cursor`, other devices appended in the gap — do NOT write sync state, instead invalidate the pull query to reconcile. After the pull succeeds, pending changes are checked and pushed if needed.

#### Scenario: Push sends the local-user header

- **WHEN** the leader issues `POST /api/sync` for local user `u1`
- **THEN** the request includes `X-Local-User-Id: u1`

#### Scenario: Unauthorized push triggers logout cleanup

- **WHEN** a push receives `401 unauthorized`
- **THEN** the app runs the logout-and-wipe flow

#### Scenario: Idempotency conflict remains a sync error

- **WHEN** a push receives `409` with error code `idempotency_conflict`
- **THEN** the app treats it as a sync protocol error rather than as an auth/logout signal

### Requirement: Compact protocol (POST /api/sync/compact with binary body)

The system SHALL produce a Yjs snapshot via `Y.encodeStateAsUpdate(doc)` and POST it to `/api/sync/compact` with `Content-Type: application/octet-stream`, `Idempotency-Key`, `X-Replaces-Up-To`, and `X-Local-User-Id` headers.

**Triggers for compaction:**

- The server includes `X-Compact-Hint: please` in a push response (only when the push was contiguous — `prevHead === cursor`).
- A push delta exceeds `MAX_BLOB_BYTES` (fallback to compact).

**Post-compact contiguity check:** same as push — if `prevHead === cursor`, write sync state; if not, invalidate pull query. After a contiguous compact, `schedulePushIfPendingChanges()` (from `src/crdt/sync-logic.ts`) checks whether dirty edits arrived during the async compact cycle.

#### Scenario: Compact sends the local-user header

- **WHEN** the leader issues `POST /api/sync/compact` for local user `u1`
- **THEN** the request includes `X-Local-User-Id: u1`

#### Scenario: Local-user mismatch compact triggers logout cleanup

- **WHEN** a compact request receives `409` with error code `local_user_mismatch`
- **THEN** the app runs the logout-and-wipe flow

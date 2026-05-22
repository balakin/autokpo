## MODIFIED Requirements

### Requirement: Pull protocol (GET with ETag and JSON response)

The system SHALL pull updates from the server using `GET /api/sync` with an `If-None-Match` header containing the current cursor and an `X-Local-User-Id` header containing the currently opened local user id. There is no `?since=` query parameter.

The server SHALL respond with `Content-Type: application/json`. On `200`, the response body SHALL be a JSON object `{ "records": [ { "seq": number, "kind": "update" | "snapshot", "encryptionKeyId": string, "blob": string } ] }` where `blob` is the base64-encoded encrypted blob.

- On `200`: decrypt each record blob, apply all records to the Y.Doc using `applyRecordsToDoc()` (from `src/crdt/sync-logic.ts`, which wraps them in a single `ydoc.transact()` with `REMOTE_ORIGIN`), then post each decrypted record as `remote-update` on BroadcastChannel, write `syncState.write({ cursor: max(head, freshCursor), stateVector, dirty })` after the transact returns, and call `schedulePushIfPendingChanges()` to schedule a push if there are pending local edits.
- On `304`: nothing to do.
- On `401`: run the logout-and-wipe flow because the local cache is no longer backed by a valid session.
- On `409` with `local_user_mismatch`: run the logout-and-wipe flow because the local cache belongs to a different account than the current session.
- On `410`: call `syncState.reset()` (zeros cursor, nulls stateVector, preserves dirty) and rethrow. React Query retries immediately once (with cursor = 0, no `If-None-Match` header), pulling from scratch. The Y.Doc is NOT touched on 410 — local offline edits survive the subsequent merge.

#### Scenario: Pull sends the local-user header

- **WHEN** the leader issues `GET /api/sync` for local user `u1`
- **THEN** the request includes `X-Local-User-Id: u1`

#### Scenario: Pull response is JSON with base64 blobs

- **WHEN** the server returns a 200 pull response
- **THEN** the response body SHALL be `application/json` containing a `records` array
- **AND** each record SHALL have `seq`, `kind`, `encryptionKeyId`, and `blob` (base64) fields

#### Scenario: Unauthorized pull triggers logout cleanup

- **WHEN** the leader pull receives `401 unauthorized`
- **THEN** the app runs the logout-and-wipe flow instead of retrying the request as a transient sync failure

#### Scenario: Local-user mismatch pull triggers logout cleanup

- **WHEN** the leader pull receives `409` with error code `local_user_mismatch`
- **THEN** the app runs the logout-and-wipe flow instead of treating the error as a generic sync conflict

### Requirement: Push protocol (POST with JSON body and push-as-poll)

The system SHALL push local changes using `POST /api/sync` with `Content-Type: application/json` and an `X-Local-User-Id` header. The request body SHALL be a JSON object `{ "id": string, "encryptionKeyId": string, "blob": string }` where `id` is a UUID generated per logical push (reused across retries), `encryptionKeyId` is the active encryption key id, and `blob` is the base64-encoded encrypted blob. The `Idempotency-Key` header is removed — the idempotency id is in the body.

**Delta computation:** `computeDelta(doc, stateVector)` (exported from `src/crdt/sync-logic.ts`) returns `Y.encodeStateAsUpdate(doc)` (full state) if `stateVector` is `null` (post-410 recovery), otherwise `Y.encodeStateAsUpdate(doc, stateVector)` (the diff since the last-acked state vector). The delta is encrypted before being base64-encoded into the body.

**Dirty flag:** `hasPendingChanges(state)` (exported from `src/crdt/sync-logic.ts`) returns `true` if `stateVector === null || dirty === true`. The `dirty` flag is set by every local Y.Doc update and cleared after a contiguous push success. This handles delete-only edits that don't advance the state vector.

**Push debounce:** local changes schedule a push after `PUSH_DEBOUNCE_MS = 2000`; rapid edits within the debounce window coalesce into a single delta.

**Large delta fallback:** if the plaintext `delta.byteLength > MAX_BLOB_BYTES` (1 MiB), the engine sends a compact (full snapshot) instead of a push.

**Push-as-poll contiguity check:** after push success, the engine computes `prevHead = assignedSeq - 1` (dense monotonic sequence). If `prevHead === cursor`, the push is contiguous — advance cursor, update stateVector, clear dirty. If `prevHead > cursor`, other devices appended in the gap — do NOT write sync state, instead invalidate the pull query to reconcile.

#### Scenario: Push sends JSON body with id and encrypted blob

- **WHEN** the leader issues `POST /api/sync`
- **THEN** the request body SHALL be `application/json` with `id`, `encryptionKeyId`, and `blob` (base64) fields
- **AND** no `Idempotency-Key` header SHALL be sent

#### Scenario: Push sends the local-user header

- **WHEN** the leader issues `POST /api/sync` for local user `u1`
- **THEN** the request includes `X-Local-User-Id: u1`

#### Scenario: Unauthorized push triggers logout cleanup

- **WHEN** a push receives `401 unauthorized`
- **THEN** the app runs the logout-and-wipe flow

#### Scenario: Idempotency conflict remains a sync error

- **WHEN** a push receives `409` with error code `idempotency_conflict`
- **THEN** the app treats it as a sync protocol error rather than as an auth/logout signal

### Requirement: Compact protocol (POST /api/sync/compact with JSON body)

The system SHALL produce a Yjs snapshot via `Y.encodeStateAsUpdate(doc)`, encrypt it, and POST to `/api/sync/compact` with `Content-Type: application/json` and `X-Local-User-Id` and `X-Replaces-Up-To` headers. The request body SHALL be a JSON object `{ "id": string, "encryptionKeyId": string, "blob": string }`. The `Idempotency-Key` header is removed — the idempotency id is in the body.

**Triggers for compaction:**

- The server includes `X-Compact-Hint: please` in a push response (only when the push was contiguous — `prevHead === cursor`).
- A push delta exceeds `MAX_BLOB_BYTES` (fallback to compact).

**Post-compact contiguity check:** same as push — if `prevHead === cursor`, write sync state; if not, invalidate pull query.

#### Scenario: Compact sends JSON body with id and encrypted snapshot

- **WHEN** the leader issues `POST /api/sync/compact`
- **THEN** the request body SHALL be `application/json` with `id`, `encryptionKeyId`, and `blob` (base64) fields
- **AND** no `Idempotency-Key` header SHALL be sent

#### Scenario: Compact sends the local-user header

- **WHEN** the leader issues `POST /api/sync/compact` for local user `u1`
- **THEN** the request includes `X-Local-User-Id: u1`

#### Scenario: Local-user mismatch compact triggers logout cleanup

- **WHEN** a compact request receives `409` with error code `local_user_mismatch`
- **THEN** the app runs the logout-and-wipe flow

## ADDED Requirements

### Requirement: sync_record table stores encrypted blobs with key reference

The D1 database SHALL store sync data in a `sync_record` table. Each row SHALL have a single-column UUID primary key `id`, a `user_id` FK to the `user` table, a monotonic `seq` integer, an encrypted `blob`, a `kind` (`update` | `snapshot`), an `encryption_key_id` FK to `user_encryption_key`, and a `created` timestamp. A unique index on `(user_id, seq)` enforces ordering integrity.

#### Scenario: Push inserts a sync_record row with encryption_key_id

- **WHEN** a push request is accepted
- **THEN** the server SHALL insert a row into `sync_record` with the provided `id`, assigned `seq`, encrypted `blob`, `kind = 'update'`, and `encryption_key_id`

#### Scenario: Compact inserts a sync_record snapshot row

- **WHEN** a compact request is accepted
- **THEN** the server SHALL insert a row into `sync_record` with `kind = 'snapshot'` and the provided `encryption_key_id`

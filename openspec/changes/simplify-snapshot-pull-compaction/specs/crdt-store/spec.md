## MODIFIED Requirements

### Requirement: Pull protocol (GET with ETag and JSON response)

The system SHALL pull updates from the server using `GET /api/sync` with an `If-None-Match` header containing the current cursor and an `X-Local-User-Id` header containing the currently opened local user id. There is no `?since=` query parameter.

The server SHALL respond with `Content-Type: application/json`. On `200`, the response body SHALL be a JSON object `{ "records": [ { "seq": number, "kind": "update" | "snapshot", "encryptionKeyId": string, "encryptionAlgorithm": "aes-256-gcm", "encryptionVersion": number, "iv": string, "ciphertext": string } ] }` where `iv` and `ciphertext` are base64-encoded.

The server SHALL treat the latest snapshot row as the current baseline. For a fresh pull (`since = 0`), the server SHALL return the latest snapshot plus rows after that snapshot, or all rows when no snapshot exists. For an incremental pull where the cursor is older than the latest snapshot, the server SHALL return `410 Gone`; the client recovers by resetting sync metadata and retrying from cursor `0`. For an incremental pull where the cursor is at or after the latest snapshot, the server SHALL return rows with `seq > since` and SHALL set `ETag` to the current server head.

- On `200`: decrypt each record, apply all records to the Y.Doc using `applyRecordsToDoc()` (from `src/crdt/sync-logic.ts`, which wraps them in a single `ydoc.transact()` with `REMOTE_ORIGIN`), then post each decrypted record as `remote-update` on BroadcastChannel, write `syncState.write({ cursor: max(head, freshCursor), stateVector, dirty })` after the transact returns, and call `schedulePushIfPendingChanges()` to schedule a push if there are pending local edits.
- On `304`: nothing to do.
- On `401`: run the logout-and-wipe flow because the local cache is no longer backed by a valid session.
- On `409` with `local_user_mismatch`: run the logout-and-wipe flow because the local cache belongs to a different account than the current session.
- On `410`: call `syncState.reset()` (zeros cursor, nulls stateVector, preserves dirty) and rethrow. React Query retries immediately once (with cursor = 0, no `If-None-Match` header), pulling from scratch. The Y.Doc is NOT touched on 410 — local offline edits survive the subsequent merge.

#### Scenario: Pull sends the local-user header

- **WHEN** the leader issues `GET /api/sync` for local user `u1`
- **THEN** the request includes `X-Local-User-Id: u1`

#### Scenario: Pull response is JSON with base64 records

- **WHEN** the server returns a 200 pull response
- **THEN** the response body SHALL be `application/json` containing a `records` array
- **AND** each record SHALL have `seq`, `kind`, `encryptionKeyId`, `encryptionAlgorithm`, `encryptionVersion`, `iv` (base64), and `ciphertext` (base64) fields

#### Scenario: Fresh pull uses latest snapshot baseline

- **WHEN** a user has update rows before and after one or more snapshot rows and the leader issues `GET /api/sync` with cursor `0`
- **THEN** the server SHALL return the latest snapshot row
- **AND** the server SHALL return rows with `seq` greater than that latest snapshot row
- **AND** the server SHALL NOT return rows older than the latest snapshot row
- **AND** the response `ETag` SHALL be the current server head

#### Scenario: Fresh pull without snapshots returns all rows

- **WHEN** a user has sync rows but no snapshot row and the leader issues `GET /api/sync` with cursor `0`
- **THEN** the server SHALL return all rows in ascending `seq` order
- **AND** the response `ETag` SHALL be the current server head

#### Scenario: Cursor older than latest snapshot returns Gone

- **WHEN** the latest snapshot for a user is at sequence `101`
- **AND** the leader issues `GET /api/sync` with cursor `100`
- **THEN** the server SHALL return `410 Gone`
- **AND** the response SHALL NOT include sync records

#### Scenario: Cursor at latest snapshot pulls incrementally

- **WHEN** the latest snapshot for a user is at sequence `101`
- **AND** the user has later update rows at sequences `102` and `103`
- **AND** the leader issues `GET /api/sync` with cursor `101`
- **THEN** the server SHALL return rows `102` and `103` in ascending `seq` order
- **AND** the response `ETag` SHALL be `103`

#### Scenario: Unauthorized pull triggers logout cleanup

- **WHEN** the leader pull receives `401 unauthorized`
- **THEN** the app runs the logout-and-wipe flow instead of retrying the request as a transient sync failure

#### Scenario: Local-user mismatch pull triggers logout cleanup

- **WHEN** the leader pull receives `409` with error code `local_user_mismatch`
- **THEN** the app runs the logout-and-wipe flow instead of treating the error as a generic sync conflict

### Requirement: Compact protocol (POST /api/sync/compact with JSON body)

The system SHALL produce a Yjs snapshot via `Y.encodeStateAsUpdate(doc)`, encrypt it, and POST to `/api/sync/compact` with `Content-Type: application/json` and `X-Local-User-Id` and `X-Replaces-Up-To` headers. The request body SHALL be a JSON object `{ "id": string, "encryptionKeyId": string, "encryptionAlgorithm": "aes-256-gcm", "encryptionVersion": number, "iv": string, "ciphertext": string }`. The `Idempotency-Key` header is removed — the idempotency id is in the body.

After accepting a compact request and inserting the snapshot row, the server SHALL delete all sync rows for that user with `seq <= X-Replaces-Up-To`. The server SHALL NOT preserve a bounded pre-snapshot tail. Clients whose cursors are older than the resulting latest snapshot recover through the pull protocol's `410 Gone` path.

**Triggers for compaction:**

- The server includes `X-Compact-Hint: please` in a push response (only when the push was contiguous — `prevHead === cursor`).
- A push delta exceeds `MAX_PLAINTEXT_DELTA_BYTES` (fallback to compact).

**Post-compact contiguity check:** same as push — if `prevHead === cursor`, write sync state; if not, invalidate pull query.

#### Scenario: Compact sends JSON body with id and encrypted snapshot

- **WHEN** the leader issues `POST /api/sync/compact`
- **THEN** the request body SHALL be `application/json` with `id`, `encryptionKeyId`, `encryptionAlgorithm`, `encryptionVersion`, `iv` (base64), and `ciphertext` (base64) fields
- **AND** no `Idempotency-Key` header SHALL be sent

#### Scenario: Compact sends the local-user header

- **WHEN** the leader issues `POST /api/sync/compact` for local user `u1`
- **THEN** the request includes `X-Local-User-Id: u1`

#### Scenario: Compact deletes covered records without retaining a tail

- **WHEN** the server accepts a compact request with `X-Replaces-Up-To: 100`
- **THEN** the server SHALL insert a snapshot row with the next sequence number
- **AND** the server SHALL delete all sync rows for that user with `seq <= 100`
- **AND** the server SHALL NOT preserve rows only to provide a pre-snapshot catch-up tail

#### Scenario: Local-user mismatch compact triggers logout cleanup

- **WHEN** a compact request receives `409` with error code `local_user_mismatch`
- **THEN** the app runs the logout-and-wipe flow

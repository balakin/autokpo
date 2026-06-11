## ADDED Requirements

### Requirement: Sync responses are non-cacheable

Every response from `/api/sync` and `/api/sync/compact` SHALL include `Cache-Control: no-store`. The system SHALL NOT rely on HTTP conditional-request caching (`If-None-Match`/`ETag`/`304 Not Modified`) for any sync endpoint. This prevents the browser or an intermediary from serving or revalidating a cached `GET /api/sync` response, which can hide or weaken response headers the client would otherwise read.

#### Scenario: Pull response forbids caching

- **WHEN** the server returns any `GET /api/sync` response
- **THEN** the response SHALL include `Cache-Control: no-store`

#### Scenario: Push response forbids caching

- **WHEN** the server returns any `POST /api/sync` response
- **THEN** the response SHALL include `Cache-Control: no-store`

#### Scenario: Compact response forbids caching

- **WHEN** the server returns any `POST /api/sync/compact` response
- **THEN** the response SHALL include `Cache-Control: no-store`

## MODIFIED Requirements

### Requirement: Event-driven sync with React Query

The system SHALL use React Query (`@tanstack/react-query`) as the network layer. Pull is a `useQuery` and push/compact are `useMutation` hooks. All three are encapsulated inside `useSyncEngine()` — feature code never calls HTTP functions directly.

#### Scenario: Pull uses React Query with staleTime

- **WHEN** the sync engine mounts as the leader tab
- **THEN** it uses `useQuery` with `queryKey: ['sync']`, `staleTime: 5 minutes`, `refetchOnWindowFocus: true`, `refetchOnReconnect: true`
- **AND** the `queryFn` reads `syncState.read().cursor` inside the fetch function to get the current cursor for the `?since=` query parameter

#### Scenario: Push uses React Query mutation with retry

- **WHEN** a push mutation is triggered
- **THEN** it uses `useMutation` with exponential backoff retry (up to 3 attempts, capped at 30 s delay), skipping retry on 413 errors

#### Scenario: Followers send sync requests via BroadcastChannel

- **WHEN** a follower tab's pull query is enabled
- **THEN** it posts `request-sync` on BroadcastChannel instead of making a network request, because only the leader talks to the server

### Requirement: Pull protocol (GET with ETag and JSON response)

The system SHALL pull updates from the server using `GET /api/sync?since=<cursor>` with an `X-Local-User-Id` header containing the currently opened local user id. The cursor SHALL travel as the `since` query parameter; the server SHALL treat a missing or empty `since` as `0`. The protocol SHALL NOT use the `If-None-Match` request header, the `ETag` response header, or `304 Not Modified` responses.

The server SHALL respond with `Content-Type: application/json` and `Cache-Control: no-store`. On the success path the server SHALL always return `200` (never `304`) with a JSON object `{ "head": number, "records": [ { "seq": number, "kind": "update" | "snapshot", "encryptionKeyId": string, "encryptionAlgorithm": "aes-256-gcm", "encryptionVersion": number, "iv": string, "ciphertext": string } ] }` where `iv` and `ciphertext` are base64-encoded and `head` is the current server head sequence. The `records` array SHALL be empty when no rows are newer than `since` and the cursor is valid.

The server SHALL treat the latest snapshot row as the current baseline. For a fresh pull (`since = 0`), the server SHALL return the latest snapshot plus rows after that snapshot, or all rows when no snapshot exists. For an incremental pull where the cursor is older than the latest snapshot, the server SHALL return `410 Gone`; the client recovers by resetting sync metadata and retrying from cursor `0`. For an incremental pull where the cursor is at or after the latest snapshot, the server SHALL return rows with `seq > since`.

- On `200`: read `head` from the response body, decrypt each record, apply all records to the Y.Doc using `applyRecordsToDoc()` (from `src/crdt/sync-logic.ts`, which wraps them in a single `ydoc.transact()` with `REMOTE_ORIGIN`), then post each decrypted record as `remote-update` on BroadcastChannel, write `syncState.write({ cursor: max(head, freshCursor), stateVector, dirty })` after the transact returns, and call `schedulePushIfPendingChanges()` to schedule a push if there are pending local edits.
- On `401`: run the logout-and-wipe flow because the local cache is no longer backed by a valid session.
- On `409` with `local_user_mismatch`: run the logout-and-wipe flow because the local cache belongs to a different account than the current session.
- On `410`: call `syncState.reset()` (zeros cursor, nulls stateVector, preserves dirty) and rethrow. React Query retries immediately once (with cursor = 0, i.e. `?since=0`), pulling from scratch. The Y.Doc is NOT touched on 410 — local offline edits survive the subsequent merge.

#### Scenario: Pull sends the cursor as a query parameter

- **WHEN** the leader issues a pull for local user `u1` with cursor `42`
- **THEN** the request SHALL be `GET /api/sync?since=42`
- **AND** the request includes `X-Local-User-Id: u1`
- **AND** the request SHALL NOT include an `If-None-Match` header

#### Scenario: Pull response is always 200 JSON with head and base64 records

- **WHEN** the server returns a successful pull response
- **THEN** the status SHALL be `200` (never `304`)
- **AND** the response body SHALL be `application/json` containing a numeric `head` and a `records` array
- **AND** each record SHALL have `seq`, `kind`, `encryptionKeyId`, `encryptionAlgorithm`, `encryptionVersion`, `iv` (base64), and `ciphertext` (base64) fields
- **AND** the response SHALL include `Cache-Control: no-store`

#### Scenario: Pull with cursor at head returns empty records and current head

- **WHEN** the server head is `103` and the leader issues `GET /api/sync?since=103`
- **THEN** the server SHALL return `200` with `head` equal to `103`
- **AND** the `records` array SHALL be empty

#### Scenario: Fresh pull uses latest snapshot baseline

- **WHEN** a user has update rows before and after one or more snapshot rows and the leader issues `GET /api/sync?since=0`
- **THEN** the server SHALL return the latest snapshot row
- **AND** the server SHALL return rows with `seq` greater than that latest snapshot row
- **AND** the server SHALL NOT return rows older than the latest snapshot row
- **AND** the response body `head` SHALL be the current server head

#### Scenario: Fresh pull without snapshots returns all rows

- **WHEN** a user has sync rows but no snapshot row and the leader issues `GET /api/sync?since=0`
- **THEN** the server SHALL return all rows in ascending `seq` order
- **AND** the response body `head` SHALL be the current server head

#### Scenario: Cursor older than latest snapshot returns Gone

- **WHEN** the latest snapshot for a user is at sequence `101`
- **AND** the leader issues `GET /api/sync?since=100`
- **THEN** the server SHALL return `410 Gone`
- **AND** the response SHALL NOT include sync records

#### Scenario: Cursor at latest snapshot pulls incrementally

- **WHEN** the latest snapshot for a user is at sequence `101`
- **AND** the user has later update rows at sequences `102` and `103`
- **AND** the leader issues `GET /api/sync?since=101`
- **THEN** the server SHALL return rows `102` and `103` in ascending `seq` order
- **AND** the response body `head` SHALL be `103`

#### Scenario: Unauthorized pull triggers logout cleanup

- **WHEN** the leader pull receives `401 unauthorized`
- **THEN** the app runs the logout-and-wipe flow instead of retrying the request as a transient sync failure

#### Scenario: Local-user mismatch pull triggers logout cleanup

- **WHEN** the leader pull receives `409` with error code `local_user_mismatch`
- **THEN** the app runs the logout-and-wipe flow instead of treating the error as a generic sync conflict

### Requirement: Push protocol (POST with JSON body and push-as-poll)

The system SHALL push local changes using `POST /api/sync` with `Content-Type: application/json` and an `X-Local-User-Id` header. The request body SHALL be a JSON object `{ "id": string, "encryptionKeyId": string, "encryptionAlgorithm": "aes-256-gcm", "encryptionVersion": number, "iv": string, "ciphertext": string }` where `id` is a UUID generated per logical push (reused across retries), `encryptionKeyId` is the active encryption key id, and `ciphertext` is the base64-encoded encrypted ciphertext. The `Idempotency-Key` header is removed — the idempotency id is in the body.

On acceptance the server SHALL respond `200` with `Cache-Control: no-store` and a JSON body `{ "assignedSeq": number, "compactHint": boolean }`, where `assignedSeq` is the dense monotonic sequence assigned to the inserted row and `compactHint` is `true` when the server is at or over its soft compaction cap. The server SHALL NOT signal the assigned sequence via an `ETag` header or the compaction hint via an `X-Compact-Hint` header.

**Delta computation:** `computeDelta(doc, stateVector)` (exported from `src/crdt/sync-logic.ts`) returns `Y.encodeStateAsUpdate(doc)` (full state) if `stateVector` is `null` (post-410 recovery), otherwise `Y.encodeStateAsUpdate(doc, stateVector)` (the diff since the last-acked state vector). The delta is encrypted before being base64-encoded into the body.

**Dirty flag:** `hasPendingChanges(state)` (exported from `src/crdt/sync-logic.ts`) returns `true` if `stateVector === null || dirty === true`. The `dirty` flag is set by every local Y.Doc update and cleared after a contiguous push success. This handles delete-only edits that don't advance the state vector.

**Push debounce:** local changes schedule a push after `PUSH_DEBOUNCE_MS = 2000`; rapid edits within the debounce window coalesce into a single delta.

**Large delta fallback:** if the plaintext `delta.byteLength > MAX_PLAINTEXT_DELTA_BYTES` (1 MiB), the engine sends a compact (full snapshot) instead of a push.

**Push-as-poll contiguity check:** after push success, the engine reads `assignedSeq` from the response body and computes `prevHead = assignedSeq - 1` (dense monotonic sequence). If `prevHead === cursor`, the push is contiguous — advance cursor, update stateVector, clear dirty. If `prevHead > cursor`, other devices appended in the gap — do NOT write sync state, instead invalidate the pull query to reconcile.

#### Scenario: Push sends JSON body with id and encrypted ciphertext

- **WHEN** the leader issues `POST /api/sync`
- **THEN** the request body SHALL be `application/json` with `id`, `encryptionKeyId`, `encryptionAlgorithm`, `encryptionVersion`, `iv` (base64), and `ciphertext` (base64) fields
- **AND** no `Idempotency-Key` header SHALL be sent

#### Scenario: Push success returns assignedSeq and compactHint in the body

- **WHEN** a push is accepted
- **THEN** the server SHALL respond `200` with a JSON body containing numeric `assignedSeq` and boolean `compactHint`
- **AND** the response SHALL include `Cache-Control: no-store`
- **AND** the server SHALL NOT set an `ETag` or `X-Compact-Hint` header as the source of those values

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

The system SHALL produce a Yjs snapshot via `Y.encodeStateAsUpdate(doc)`, encrypt it, and POST to `/api/sync/compact` with `Content-Type: application/json` and `X-Local-User-Id` and `X-Replaces-Up-To` headers. The request body SHALL be a JSON object `{ "id": string, "encryptionKeyId": string, "encryptionAlgorithm": "aes-256-gcm", "encryptionVersion": number, "iv": string, "ciphertext": string }`. The `Idempotency-Key` header is removed — the idempotency id is in the body.

On acceptance the server SHALL respond `200` with `Cache-Control: no-store` and a JSON body `{ "assignedSeq": number }`, where `assignedSeq` is the sequence assigned to the snapshot row. The server SHALL NOT signal the assigned sequence via an `ETag` header.

After accepting a compact request and inserting the snapshot row, the server SHALL delete all sync rows for that user with `seq <= X-Replaces-Up-To`. The server SHALL NOT preserve a bounded pre-snapshot tail. Clients whose cursors are older than the resulting latest snapshot recover through the pull protocol's `410 Gone` path.

**Triggers for compaction:**

- A push response body has `compactHint: true` (only set when the push was contiguous — `prevHead === cursor`).
- A push delta exceeds `MAX_PLAINTEXT_DELTA_BYTES` (fallback to compact).

**Post-compact contiguity check:** same as push — read `assignedSeq` from the response body; if `prevHead === cursor`, write sync state; if not, invalidate pull query.

#### Scenario: Compact sends JSON body with id and encrypted snapshot

- **WHEN** the leader issues `POST /api/sync/compact`
- **THEN** the request body SHALL be `application/json` with `id`, `encryptionKeyId`, `encryptionAlgorithm`, `encryptionVersion`, `iv` (base64), and `ciphertext` (base64) fields
- **AND** no `Idempotency-Key` header SHALL be sent

#### Scenario: Compact success returns assignedSeq in the body

- **WHEN** a compact request is accepted
- **THEN** the server SHALL respond `200` with a JSON body containing numeric `assignedSeq`
- **AND** the response SHALL include `Cache-Control: no-store`
- **AND** the server SHALL NOT set an `ETag` header as the source of that value

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

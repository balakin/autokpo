## ADDED Requirements

### Requirement: Session-gated worker routes

The worker SHALL require an authenticated session for exchange-rate routes and sync routes. Session identity SHALL be derived from the server-side `better-auth` session tied to the incoming HttpOnly cookie.

#### Scenario: Exchange-rate route accepts authenticated session

- **WHEN** an authenticated request reaches an exchange-rate endpoint
- **THEN** the worker allows the request without requiring a local-user assertion header

#### Scenario: Protected route rejects missing session

- **WHEN** a request reaches a protected exchange-rate or sync endpoint without a valid authenticated session
- **THEN** the worker responds with `401 Unauthorized`
- **AND** the JSON body includes a machine-readable error code indicating unauthorized access

## MODIFIED Requirements

### Requirement: `updates` table schema

The system SHALL define a single table `updates` with the following columns:

- `user_id` TEXT, NOT NULL
- `seq` INTEGER, NOT NULL, monotonically increasing per `user_id` (assigned by the server, not auto-incremented)
- `blob` BLOB, NOT NULL — opaque payload (Yjs update bytes; opaque to the server)
- `kind` TEXT, NOT NULL, one of `'update'` or `'snapshot'`
- `idempotency_key` TEXT, nullable — unique per user, used for deduplicating retries
- `created` INTEGER, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`

The primary key SHALL be the composite `(user_id, seq)`. A unique index SHALL exist on `(user_id, idempotency_key)`.

The worker SHALL derive `user_id` for every sync query from the authenticated session user id rather than from a hard-coded prototype value.

#### Scenario: Schema present after first migration

- **WHEN** migrations are applied to a fresh D1
- **THEN** the `updates` table exists with the columns, primary key, and unique index listed above

#### Scenario: Sync rows are partitioned by authenticated user

- **WHEN** two different authenticated users perform sync operations
- **THEN** their update rows are stored and queried under different `user_id` values derived from the worker session

### Requirement: GET /api/sync endpoint

The worker SHALL expose `GET /api/sync` that returns updates newer than the client's last-known cursor. The client's position is communicated via the `If-None-Match` HTTP header containing the cursor value quoted as an ETag (e.g. `"42"`). There is no `?since=` query parameter.

**Request headers:**

| Header            | Required | Meaning                                                                             |
| ----------------- | -------- | ----------------------------------------------------------------------------------- |
| `If-None-Match`   | no       | Client's last-known head seq, quoted (e.g. `"42"`). Absent means "send everything". |
| `X-Local-User-Id` | yes      | User id for the local cache currently opened in the browser.                        |

**Response statuses:**

| Status             | Meaning                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `200 OK`           | Body is a binary record stream. `ETag` header contains the current head seq quoted (e.g. `"42"`). Empty body if the user has no rows.       |
| `304 Not Modified` | `If-None-Match` matched the current head. Empty body. `ETag` header present.                                                                |
| `400 Bad Request`  | Missing `X-Local-User-Id` header. JSON body includes a machine-readable error code.                                                         |
| `401 Unauthorized` | No valid authenticated session. JSON body includes a machine-readable error code.                                                           |
| `409 Conflict`     | `X-Local-User-Id` does not match the authenticated session user. JSON body includes a machine-readable `local_user_mismatch` error code.    |
| `410 Gone`         | The client's cursor is stale (older than the earliest retained row) or impossibly ahead of the current head. Client must reset and re-pull. |

#### Scenario: Returns updates after the cursor

- **WHEN** an authenticated `GET /api/sync` request arrives with `If-None-Match: "5"`, `X-Local-User-Id` matching the session user, and the database has rows with `seq` 1..10 for that user
- **THEN** the response status is 200, the body is a binary record stream containing rows with `seq` 6..10, and the `ETag` header is `"10"`

#### Scenario: Missing local-user header returns 400

- **WHEN** an authenticated `GET /api/sync` request omits `X-Local-User-Id`
- **THEN** the response status is 400 and the JSON body identifies the missing-header error

#### Scenario: Local user mismatch returns 409

- **WHEN** an authenticated `GET /api/sync` request includes `X-Local-User-Id` for a different user than the session user
- **THEN** the response status is 409 and the JSON body identifies `local_user_mismatch`

#### Scenario: Empty database returns 200 with ETag "0"

- **WHEN** no rows exist for the authenticated user and the request includes the matching `X-Local-User-Id`
- **THEN** the response status is 200, the body is empty, and the `ETag` header is `"0"`

### Requirement: POST /api/sync endpoint

The worker SHALL expose `POST /api/sync` accepting raw bytes (`Content-Type: application/octet-stream`). It SHALL append a row with `kind = 'update'`, the next monotonically increasing `seq`, and the request body as `blob`.

**Request headers:**

| Header            | Required | Meaning                                                      |
| ----------------- | -------- | ------------------------------------------------------------ |
| `Content-Type`    | yes      | Must be `application/octet-stream`.                          |
| `Content-Length`  | yes      | Validated before reading body. Reject if > `MAX_BLOB_BYTES`  |
| `Idempotency-Key` | yes      | Per-update UUID for deduplication across retries.            |
| `X-Local-User-Id` | yes      | User id for the local cache currently opened in the browser. |

**Idempotency contract:** If a row with the same `(user_id, idempotency_key)` already exists and its blob bytes match the request body, return `200` with that row's seq as the `ETag`. If the blob bytes differ, return `409 Conflict` with a machine-readable `idempotency_conflict` error code.

**Response statuses:**

| Status                       | Meaning                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `200 OK`                     | Row inserted (or idempotent duplicate). `ETag` header: `"<assignedSeq>"`. Empty body.                                                                        |
| `400 Bad Request`            | Missing `Idempotency-Key` or `X-Local-User-Id` header. JSON body includes a machine-readable code.                                                           |
| `401 Unauthorized`           | No valid authenticated session. JSON body includes a machine-readable error code.                                                                            |
| `409 Conflict`               | Same idempotency key exists with different blob content, or the local user id does not match the session user. JSON body identifies which conflict occurred. |
| `413 Payload Too Large`      | Either `Content-Length > MAX_BLOB_BYTES` or total user storage would exceed `HARD_CAP_BYTES`.                                                                |
| `415 Unsupported Media Type` | `Content-Type` is not `application/octet-stream`.                                                                                                            |

**Conditional header:** The response SHALL include `X-Compact-Hint: please` if, after the insertion, the user's row count ≥ `SOFT_CAP_ROWS` or total byte size ≥ `SOFT_CAP_BYTES`.

#### Scenario: Append assigns the next seq for the authenticated user

- **WHEN** the latest existing row for the authenticated user has `seq = N` and a valid `POST /api/sync` request arrives with a matching `X-Local-User-Id`
- **THEN** the new row is inserted with `seq = N + 1`, `kind = 'update'`, and the response `ETag` header is `"<N+1>"`

#### Scenario: Conflicting idempotency key returns typed 409

- **WHEN** a `POST /api/sync` arrives with an `Idempotency-Key` that already exists for the authenticated user but with different blob content
- **THEN** the response status is 409, the JSON body identifies `idempotency_conflict`, and no new row is inserted

#### Scenario: Local user mismatch returns typed 409

- **WHEN** an authenticated `POST /api/sync` request includes `X-Local-User-Id` for a different user than the session user
- **THEN** the response status is 409 and the JSON body identifies `local_user_mismatch`

### Requirement: POST /api/sync/compact endpoint

The worker SHALL expose `POST /api/sync/compact` accepting raw bytes (`Content-Type: application/octet-stream`) as the snapshot blob. It SHALL atomically insert a `kind = 'snapshot'` row and delete rows that the snapshot subsumes, preserving a tail for incremental pulls.

**Request headers:**

| Header             | Required | Meaning                                                                         |
| ------------------ | -------- | ------------------------------------------------------------------------------- |
| `Content-Type`     | yes      | Must be `application/octet-stream`.                                             |
| `Content-Length`   | yes      | Validated before reading body. Reject if > `MAX_BLOB_BYTES`.                    |
| `Idempotency-Key`  | yes      | UUID for deduplication across retries.                                          |
| `X-Replaces-Up-To` | yes      | Integer — the highest seq the client claims is fully merged into this snapshot. |
| `X-Local-User-Id`  | yes      | User id for the local cache currently opened in the browser.                    |

**Idempotency contract:** Same as POST — if an existing row has the same key, return 200 with that seq as `ETag`. No re-insert, no re-delete. If the same key is reused with different content, return `409 Conflict` with a machine-readable `idempotency_conflict` error code.

**Compact processing (single D1 batch):**

1. Check auth session and local-user match.
2. Check idempotency key.
3. Read current `head = MAX(seq)` for the authenticated user. Reject with `409` if `X-Replaces-Up-To > head`.
4. Insert the snapshot row at `seq = head + 1`, `kind = 'snapshot'`.
5. Compute `keep_cutoff`: walk existing rows from newest to oldest, accumulating `(rows, bytes)`. `keep_cutoff` is the `seq` below the last retained row such that rows with `keep_cutoff < seq ≤ head` fit within both `COMPACT_TAIL_MAX_ROWS` (50) and `COMPACT_TAIL_MAX_BYTES` (256 KiB). If even a single row exceeds both budgets, `keep_cutoff = head` (nothing preserved as tail).
6. `effective_cutoff = min(X-Replaces-Up-To, keep_cutoff)`.
7. Delete `WHERE user_id = ? AND seq <= effective_cutoff`.

**Response statuses:**

| Status                       | Meaning                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `200 OK`                     | Snapshot inserted and old rows deleted. `ETag: "<nextSeq>"`. Empty body.                                               |
| `400 Bad Request`            | Missing `Idempotency-Key`, `X-Replaces-Up-To`, or `X-Local-User-Id`. JSON body includes a machine-readable code.       |
| `401 Unauthorized`           | No valid authenticated session. JSON body includes a machine-readable error code.                                      |
| `409 Conflict`               | `X-Replaces-Up-To > head`, idempotency conflict, or local user mismatch. JSON body identifies which conflict occurred. |
| `413 Payload Too Large`      | `Content-Length > MAX_BLOB_BYTES` or total bytes would exceed `HARD_CAP_BYTES`.                                        |
| `415 Unsupported Media Type` | `Content-Type` is not `application/octet-stream`.                                                                      |

**Conditional header:** The response SHALL include `X-Compact-Hint: please` if, after the operation, the user's row count ≥ `SOFT_CAP_ROWS` or total byte size ≥ `SOFT_CAP_BYTES`.

#### Scenario: Snapshot replaces older rows for the authenticated user

- **WHEN** the authenticated user's database holds rows with `seq` 1..10 and a valid `POST /api/sync/compact` arrives with matching `X-Local-User-Id` and `X-Replaces-Up-To: 10`
- **THEN** within a single D1 transaction a `kind='snapshot'` row is inserted at `seq = 11`, rows with `seq ≤ min(10, keep_cutoff)` are deleted, and the response `ETag` is `"11"`

#### Scenario: Local user mismatch returns typed 409 during compact

- **WHEN** an authenticated `POST /api/sync/compact` request includes `X-Local-User-Id` for a different user than the session user
- **THEN** the response status is 409 and the JSON body identifies `local_user_mismatch`

## REMOVED Requirements

### Requirement: Phase 0 hardcoded user identity

**Reason**: Sync is no longer a prototype single-user system; the worker must derive identity from the authenticated session.
**Migration**: Remove the hard-coded `user_id = '0'` assumption and require clients to send `X-Local-User-Id` on all sync requests while the worker uses the session user id as authority.

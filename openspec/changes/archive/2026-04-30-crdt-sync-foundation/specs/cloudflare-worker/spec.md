## ADDED Requirements

### Requirement: D1 database binding

The worker SHALL declare a Cloudflare D1 database binding named `DB` in `wrangler.jsonc`, and the binding SHALL appear in the generated `worker-configuration.d.ts` so handlers can access it as `env.DB`.

#### Scenario: Binding present in wrangler config

- **WHEN** `wrangler.jsonc` is loaded
- **THEN** it declares a `d1_databases` entry whose `binding` is `DB` and whose `migrations_dir` points to `./worker/db/migrations`

#### Scenario: Generated types include DB binding

- **WHEN** `pnpm generate:worker-types` is run
- **THEN** the resulting `worker-configuration.d.ts` includes `DB: D1Database` on the worker `Env` type

### Requirement: Drizzle ORM and migrations layout

The worker SHALL use Drizzle ORM with the D1 driver. The schema SHALL live at `worker/db/schema.ts`, generated SQL migrations SHALL be committed under `worker/db/migrations/`, and `drizzle.config.ts` at the repo root SHALL reference both locations.

#### Scenario: Schema is the single source of truth

- **WHEN** a developer runs `pnpm drizzle-kit generate`
- **THEN** Drizzle reads `worker/db/schema.ts` and writes migration SQL files into `worker/db/migrations/`

#### Scenario: Migrations are applied to local D1 for `pnpm dev`

- **WHEN** a developer runs `pnpm db:migrate:local`
- **THEN** all unapplied migrations are applied to the local SQLite-backed D1 instance under `.wrangler/state/`

#### Scenario: Migrations are applied in CI/deploy

- **WHEN** the deploy pipeline runs `pnpm db:migrate:remote`
- **THEN** all unapplied migrations are applied to the production D1 instance before the worker is deployed

### Requirement: `updates` table schema

The system SHALL define a single table `updates` with the following columns:

- `user_id` TEXT, NOT NULL
- `seq` INTEGER, NOT NULL, monotonically increasing per `user_id` (assigned by the server, not auto-incremented)
- `blob` BLOB, NOT NULL — opaque payload (Yjs update bytes; opaque to the server)
- `kind` TEXT, NOT NULL, one of `'update'` or `'snapshot'`
- `idempotency_key` TEXT, nullable — unique per user, used for deduplicating retries
- `created` INTEGER, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`

The primary key SHALL be the composite `(user_id, seq)`. A unique index SHALL exist on `(user_id, idempotency_key)`.

For Phase 0 the server SHALL hardcode `user_id = '0'` in every query; the client never sends a user identifier.

#### Scenario: Schema present after first migration

- **WHEN** migrations are applied to a fresh D1
- **THEN** the `updates` table exists with the columns, primary key, and unique index listed above

### Requirement: Binary record stream wire format

The GET response body and the POST/compact request body SHALL be raw binary (`application/octet-stream`). The GET response uses a binary record stream format:

```
record := u32_be(seq) u8(kind) u32_be(length) bytes(length)
kind   := 0x01 (update) | 0x02 (snapshot)
```

No multipart, no base64, no JSON wrapping the blobs. The client parses the stream in a tight loop over a single `ArrayBuffer`.

### Requirement: GET /api/sync endpoint

The worker SHALL expose `GET /api/sync` that returns updates newer than the client's last-known cursor. The client's position is communicated via the `If-None-Match` HTTP header containing the cursor value quoted as an ETag (e.g. `"42"`). There is no `?since=` query parameter.

**Request headers:**

| Header          | Required | Meaning                                                                             |
| --------------- | -------- | ----------------------------------------------------------------------------------- |
| `If-None-Match` | no       | Client's last-known head seq, quoted (e.g. `"42"`). Absent means "send everything". |

**Response statuses:**

| Status             | Meaning                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `200 OK`           | Body is a binary record stream. `ETag` header contains the current head seq quoted (e.g. `"42"`). Empty body if the user has no rows.       |
| `304 Not Modified` | `If-None-Match` matched the current head. Empty body. `ETag` header present.                                                                |
| `410 Gone`         | The client's cursor is stale (older than the earliest retained row) or impossibly ahead of the current head. Client must reset and re-pull. |

#### Scenario: Returns updates after the cursor

- **WHEN** a `GET /api/sync` request arrives with `If-None-Match: "5"` and the database has rows with `seq` 1..10 for user `'0'`
- **THEN** the response status is 200, the body is a binary record stream containing rows with `seq` 6..10, and the `ETag` header is `"10"`

#### Scenario: No If-None-Match sends everything

- **WHEN** a `GET /api/sync` request arrives without `If-None-Match` and the database has rows with `seq` 1..10
- **THEN** the response status is 200 with all 10 rows in the stream

#### Scenario: ETag match returns 304

- **WHEN** `If-None-Match` equals the current head
- **THEN** the response status is 304 with an empty body

#### Scenario: Stale cursor receives 410

- **WHEN** the client's cursor is older than the earliest retained row (i.e. compaction has removed all rows up to the cursor)
- **THEN** the response status is 410 Gone

#### Scenario: Cursor ahead of head receives 410

- **WHEN** the client's cursor is greater than the current head (server data loss / backup restore)
- **THEN** the response status is 410 Gone

#### Scenario: Empty database returns 200 with ETag "0"

- **WHEN** no rows exist for the user
- **THEN** the response status is 200, the body is empty, and the `ETag` header is `"0"`

### Requirement: POST /api/sync endpoint

The worker SHALL expose `POST /api/sync` accepting raw bytes (`Content-Type: application/octet-stream`). It SHALL append a row with `kind = 'update'`, the next monotonically increasing `seq`, and the request body as `blob`.

**Request headers:**

| Header            | Required | Meaning                                                     |
| ----------------- | -------- | ----------------------------------------------------------- |
| `Content-Type`    | yes      | Must be `application/octet-stream`.                         |
| `Content-Length`  | yes      | Validated before reading body. Reject if > `MAX_BLOB_BYTES` |
| `Idempotency-Key` | yes      | Per-update UUID for deduplication across retries.           |

**Idempotency contract:** If a row with the same `(user_id, idempotency_key)` already exists and its blob bytes match the request body, return `200` with that row's seq as the `ETag`. If the blob bytes differ, return `409 Conflict`.

**Response statuses:**

| Status                       | Meaning                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `200 OK`                     | Row inserted (or idempotent duplicate). `ETag` header: `"<assignedSeq>"`. Empty body.         |
| `400 Bad Request`            | Missing `Idempotency-Key` header.                                                             |
| `409 Conflict`               | Same idempotency key exists with different blob content.                                      |
| `413 Payload Too Large`      | Either `Content-Length > MAX_BLOB_BYTES` or total user storage would exceed `HARD_CAP_BYTES`. |
| `415 Unsupported Media Type` | `Content-Type` is not `application/octet-stream`.                                             |

**Conditional header:** The response SHALL include `X-Compact-Hint: please` if, after the insertion, the user's row count ≥ `SOFT_CAP_ROWS` or total byte size ≥ `SOFT_CAP_BYTES`.

#### Scenario: Append assigns the next seq

- **WHEN** the latest existing row for the user has `seq = N` and a valid `POST /api/sync` request arrives
- **THEN** the new row is inserted with `seq = N + 1`, `kind = 'update'`, and the response `ETag` header is `"<N+1>"`

#### Scenario: Idempotent duplicate returns same seq

- **WHEN** a `POST /api/sync` arrives with an `Idempotency-Key` that already exists for the user with identical blob content
- **THEN** the response status is 200, the `ETag` header contains the existing row's seq, and no duplicate row is inserted

#### Scenario: Conflicting idempotency key returns 409

- **WHEN** a `POST /api/sync` arrives with an `Idempotency-Key` that already exists for the user but with different blob content
- **THEN** the response status is 409 and no new row is inserted

#### Scenario: Hard cap rejects oversized state

- **WHEN** an append would push the user's total byte size past `HARD_CAP_BYTES` (4 MiB)
- **THEN** the response status is 413 and no row is inserted

#### Scenario: Oversized single blob rejected

- **WHEN** `Content-Length` exceeds `MAX_BLOB_BYTES` (1 MiB)
- **THEN** the response status is 413 and the body is not read

#### Scenario: Wrong content type rejected

- **WHEN** `Content-Type` is not `application/octet-stream`
- **THEN** the response status is 415

#### Scenario: Soft-cap hint emitted

- **WHEN** an append succeeds and afterward the user's row count ≥ 200 or total byte size ≥ 2 MiB
- **THEN** the response includes the header `X-Compact-Hint: please`

### Requirement: POST /api/sync/compact endpoint

The worker SHALL expose `POST /api/sync/compact` accepting raw bytes (`Content-Type: application/octet-stream`) as the snapshot blob. It SHALL atomically insert a `kind = 'snapshot'` row and delete rows that the snapshot subsumes, preserving a tail for incremental pulls.

**Request headers:**

| Header             | Required | Meaning                                                                         |
| ------------------ | -------- | ------------------------------------------------------------------------------- |
| `Content-Type`     | yes      | Must be `application/octet-stream`.                                             |
| `Content-Length`   | yes      | Validated before reading body. Reject if > `MAX_BLOB_BYTES`.                    |
| `Idempotency-Key`  | yes      | UUID for deduplication across retries.                                          |
| `X-Replaces-Up-To` | yes      | Integer — the highest seq the client claims is fully merged into this snapshot. |

**Idempotency contract:** Same as POST — if an existing row has the same key, return 200 with that seq as `ETag`. No re-insert, no re-delete.

**Compact processing (single D1 batch):**

1. Check idempotency key.
2. Read current `head = MAX(seq)` for the user. Reject with `409` if `X-Replaces-Up-To > head`.
3. Insert the snapshot row at `seq = head + 1`, `kind = 'snapshot'`.
4. Compute `keep_cutoff`: walk existing rows from newest to oldest, accumulating `(rows, bytes)`. `keep_cutoff` is the `seq` below the last retained row such that rows with `keep_cutoff < seq ≤ head` fit within both `COMPACT_TAIL_MAX_ROWS` (50) and `COMPACT_TAIL_MAX_BYTES` (256 KiB). If even a single row exceeds both budgets, `keep_cutoff = head` (nothing preserved as tail).
5. `effective_cutoff = min(X-Replaces-Up-To, keep_cutoff)`.
6. Delete `WHERE user_id = ? AND seq <= effective_cutoff`.

**Response statuses:**

| Status                       | Meaning                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `200 OK`                     | Snapshot inserted and old rows deleted. `ETag: "<nextSeq>"`. Empty body.                                   |
| `400 Bad Request`            | Missing `Idempotency-Key` or `X-Replaces-Up-To`.                                                           |
| `409 Conflict`               | `X-Replaces-Up-To > head` (client cursor from the future) or idempotency key conflict with different blob. |
| `413 Payload Too Large`      | `Content-Length > MAX_BLOB_BYTES` or total bytes would exceed `HARD_CAP_BYTES`.                            |
| `415 Unsupported Media Type` | `Content-Type` is not `application/octet-stream`.                                                          |

**Conditional header:** The response SHALL include `X-Compact-Hint: please` if, after the operation, the user's row count ≥ `SOFT_CAP_ROWS` or total byte size ≥ `SOFT_CAP_BYTES`.

#### Scenario: Snapshot replaces older rows atomically

- **WHEN** the database holds rows with `seq` 1..10 and a `POST /api/sync/compact` arrives with `X-Replaces-Up-To: 10` and the tail budget allows keeping up to 50 rows / 256 KiB
- **THEN** within a single D1 transaction a `kind='snapshot'` row is inserted at `seq = 11`, rows with `seq ≤ min(10, keep_cutoff)` are deleted, and the response `ETag` is `"11"`

#### Scenario: Idempotent duplicate compact

- **WHEN** a `POST /api/sync/compact` arrives with an `Idempotency-Key` that already exists
- **THEN** the response status is 200 with the existing row's seq as `ETag`, no re-insert, no re-delete

#### Scenario: X-Replaces-Up-To exceeds head returns 409

- **WHEN** `X-Replaces-Up-To` is greater than the current `head`
- **THEN** the response status is 409

#### Scenario: Compact preserves tail for incremental pulls

- **WHEN** compaction runs with `X-Replaces-Up-To = 100` and the tail has 30 rows within the byte budget
- **THEN** `keep_cutoff` is set to `head - 30` and rows between `keep_cutoff + 1` and `head` are retained as an incremental tail

#### Scenario: Concurrent compactions do not corrupt state

- **WHEN** two clients submit `POST /api/sync/compact` near-simultaneously with overlapping `X-Replaces-Up-To` values
- **THEN** both transactions complete — each inserts its own snapshot row at a distinct `seq`, and the `min(X-Replaces-Up-To, keep_cutoff)` clamp ensures neither deletes rows the other's client hasn't merged

### Requirement: Phase 0 hardcoded user identity

For Phase 0 the worker SHALL hardcode `user_id = '0'` for every request, and the client SHALL NOT send any user identifier. Authentication and per-user identity are deferred to a later change.

#### Scenario: Client sends no user_id

- **WHEN** the client issues any `/api/sync*` request
- **THEN** the request body and headers do not contain a user identifier, and the server treats the request as coming from `user_id = '0'`

### Requirement: Storage limits constants

The worker SHALL enforce the following constants:

| Constant                 | Value   | Purpose                                                   |
| ------------------------ | ------- | --------------------------------------------------------- |
| `MAX_BLOB_BYTES`         | 1 MiB   | Per-blob size limit on POST requests                      |
| `SOFT_CAP_ROWS`          | 200     | Row count threshold for `X-Compact-Hint`                  |
| `SOFT_CAP_BYTES`         | 2 MiB   | Byte count threshold for `X-Compact-Hint`                 |
| `HARD_CAP_BYTES`         | 4 MiB   | Total storage per user; rejects push with 413 if exceeded |
| `COMPACT_TAIL_MAX_ROWS`  | 50      | Max rows retained as incremental tail after compaction    |
| `COMPACT_TAIL_MAX_BYTES` | 256 KiB | Max bytes retained as incremental tail after compaction   |

### Requirement: Worker tests apply migrations to in-memory D1

The worker test setup SHALL apply all Drizzle migrations to the test D1 instance before each suite that exercises the database, using `@cloudflare/vitest-pool-workers`'s `env.DB` binding. The helper SHALL be reusable from any worker spec.

#### Scenario: Test suite starts with the migrated schema

- **WHEN** a worker spec opens with `beforeEach(() => applyMigrations(env.DB))`
- **THEN** every test sees an empty but fully migrated `updates` table

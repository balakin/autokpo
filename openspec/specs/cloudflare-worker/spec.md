## ADDED Requirements

### Requirement: Cloudflare Worker entry point

The system SHALL provide a Cloudflare Worker entry point at `worker/main.ts` using the Hono framework that exposes API routes under `/api/*`.

#### Scenario: Health check endpoint responds

- **WHEN** a request is made to `GET /api/`
- **THEN** the worker responds with status 200 and a plain-text greeting

#### Scenario: Unknown API route returns 404

- **WHEN** a request is made to an unregistered `/api/*` path
- **THEN** the worker responds with status 404

### Requirement: Wrangler configuration

The system SHALL include a `wrangler.jsonc` that configures the worker name, compatibility date, entry point, and static assets serving with SPA fallback.

#### Scenario: Worker routes API requests

- **WHEN** a request matches `/api/*`
- **THEN** `run_worker_first` routes it to the worker before serving static assets

#### Scenario: Static SPA fallback for non-API routes

- **WHEN** a request does not match `/api/*`
- **THEN** `not_found_handling: single-page-application` serves the SPA shell

### Requirement: Worker type generation

The system SHALL provide `pnpm generate:worker-types` to regenerate `worker-configuration.d.ts` from `wrangler.jsonc`, and `pnpm check:worker-types` to verify the generated types are up to date. These scripts SHALL be defined in `apps/app/package.json` and invoked from the repository root via `turbo run generate:worker-types` and `turbo run check:worker-types`.

#### Scenario: Type generation after config change

- **WHEN** a developer modifies `wrangler.jsonc` and runs `pnpm generate:worker-types`
- **THEN** `turbo run generate:worker-types` delegates to `@autokpo/app` where `wrangler types` regenerates `worker-configuration.d.ts` at `apps/app/worker-configuration.d.ts`

#### Scenario: CI rejects stale types

- **WHEN** `wrangler.jsonc` has changed but `worker-configuration.d.ts` has not been regenerated
- **THEN** `pnpm check:worker-types` exits with a non-zero code

### Requirement: Separate Vitest projects for app and worker

The system SHALL split Vitest configuration into two projects: `app` (jsdom environment, React Testing Library) and `worker` (Cloudflare Workers pool). The root `vitest.config.ts` SHALL reference both via the `projects` option.

#### Scenario: App tests run in jsdom

- **WHEN** `pnpm test` is executed
- **THEN** app tests (`src/**/*.spec.{ts,tsx}`, `tests/app/**/*.spec.{ts,tsx}`) run in a jsdom environment with React Testing Library setup

#### Scenario: Worker tests run in Workers runtime

- **WHEN** `pnpm test` is executed
- **THEN** worker tests (`worker/**/*.spec.ts`, `tests/worker/**/*.spec.ts`) run using the Cloudflare Vitest pool with the Wrangler config

### Requirement: Separate TypeScript configs for worker and tests

The system SHALL provide dedicated TypeScript project references: `tsconfig.worker.json` for worker source, `tsconfig.worker.tests.json` for worker tests, and `tsconfig.app.tests.json` (renamed from `tsconfig.tests.json`) for app tests. `tsconfig.json` SHALL reference all four projects.

#### Scenario: Worker sources type-check independently

- **WHEN** `tsc -b` is run
- **THEN** `tsconfig.worker.json` type-checks `worker/` with `worker-configuration.d.ts` types, excluding spec files

#### Scenario: Worker test sources type-check independently

- **WHEN** `tsc -b` is run
- **THEN** `tsconfig.worker.tests.json` type-checks `tests/worker/` and `worker/**/*.spec.ts` with `@cloudflare/vitest-pool-workers` types

#### Scenario: App test sources type-check independently

- **WHEN** `tsc -b` is run
- **THEN** `tsconfig.app.tests.json` type-checks `tests/app/` with `src/` and `tests/app/` path aliases

### Requirement: Cloudflare Vite plugin integration

The system SHALL integrate `@cloudflare/vite-plugin` in `vite.config.ts` so the SPA and worker build as a single unit. The plugin SHALL NOT be loaded during tests (`mode === 'test'`).

#### Scenario: Production build includes both SPA and worker

- **WHEN** `pnpm build` is run
- **THEN** the Cloudflare Vite plugin produces a combined output for the SPA and worker

#### Scenario: Plugin is skipped in test mode

- **WHEN** Vite runs in test mode
- **THEN** the Cloudflare Vite plugin is not loaded

### Requirement: PWA excludes worker routes from caching

The system SHALL configure the PWA service worker's `navigateFallbackDenylist` to exclude `/api/*` and `/__debug` from navigation fallback and caching.

#### Scenario: API routes bypass service worker navigation fallback

- **WHEN** the service worker receives a navigation request for `/api/*` or `/__debug`
- **THEN** the request bypasses the cached `index.html` fallback and proceeds to the worker

### Requirement: Pre-commit and CI enforcement

The system SHALL enforce worker type freshness via `pnpm check:worker-types` in both the pre-commit hook and the CI pipeline.

#### Scenario: Pre-commit hook checks types

- **WHEN** a developer commits changes
- **THEN** the pre-commit hook runs `pnpm check:worker-types` after lint and i18n extraction

#### Scenario: CI pipeline checks types

- **WHEN** the CI pipeline runs
- **THEN** it includes a step that runs `turbo run check:worker-types` after setup

---

### Requirement: Exchange rates currencies proxy endpoint

The system SHALL expose `GET /api/exchange-rates/currencies` that proxies `https://kurs.resenje.org/api/v1/currencies` and returns the list of NBS-listed currencies. The response SHALL be cached at the Cloudflare edge for 24 hours.

#### Scenario: Returns currency list

- **WHEN** a request is made to `GET /api/exchange-rates/currencies`
- **THEN** the worker responds with status 200 and JSON body `{ currencies: [{ code, country }] }` sourced from kurs.resenje.org

#### Scenario: Upstream error propagated

- **WHEN** kurs.resenje.org returns a non-200 response for the currencies request
- **THEN** the worker SHALL respond with the same HTTP status code and a JSON error body

#### Scenario: Response cached at edge for 24 hours

- **WHEN** `GET /api/exchange-rates/currencies` is requested more than once within 24 hours
- **THEN** subsequent requests within the cache window SHALL be served from the Cloudflare edge cache without calling kurs.resenje.org

---

### Requirement: Exchange rate proxy endpoint

The system SHALL expose `GET /api/exchange-rates/rate?currency={CODE}&date={YYYY-MM-DD}` that proxies `https://kurs.resenje.org/api/v1/currencies/{CODE}/rates/{YYYY-MM-DD}` and returns the NBS exchange rate for the given currency on the given date. The response SHALL include `exchange_middle`, `parity`, `date`, and `date_from`. Historical rates (dates before today in Europe/Belgrade) SHALL be cached at the Cloudflare edge for 1 year. Today's rate SHALL be cached for 1 hour.

#### Scenario: Returns rate for a past date

- **WHEN** a request is made to `GET /api/exchange-rates/rate?currency=EUR&date=2026-01-15`
- **THEN** the worker responds with status 200 and JSON body containing `{ exchange_middle, parity, date, date_from }`

#### Scenario: Returns rate for today

- **WHEN** a request is made to `GET /api/exchange-rates/rate?currency=EUR&date={today}`
- **THEN** the worker responds with status 200 and JSON body containing `{ exchange_middle, parity, date, date_from }`

#### Scenario: Missing query parameters return 400

- **WHEN** a request is made to `GET /api/exchange-rates/rate` with `currency` or `date` missing
- **THEN** the worker SHALL respond with status 400 and a JSON error body

#### Scenario: Unknown currency returns 404

- **WHEN** a request is made with an unrecognised currency code
- **THEN** the worker SHALL respond with status 404

#### Scenario: Historical rate cached for 1 year

- **WHEN** `GET /api/exchange-rates/rate?currency=EUR&date=2026-01-15` is requested more than once
- **THEN** subsequent requests SHALL be served from the Cloudflare edge cache without calling kurs.resenje.org

#### Scenario: Today's rate cached for 1 hour

- **WHEN** `GET /api/exchange-rates/rate?currency=EUR&date={today}` is requested within the same hour
- **THEN** subsequent requests within the 1-hour window SHALL be served from the Cloudflare edge cache

---

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

- `user_id` TEXT, NOT NULL, referencing `user.id` with `ON DELETE CASCADE`
- `seq` INTEGER, NOT NULL, monotonically increasing per `user_id` (assigned by the server, not auto-incremented)
- `blob` BLOB, NOT NULL — opaque payload (Yjs update bytes; opaque to the server)
- `kind` TEXT, NOT NULL, one of `'update'` or `'snapshot'`
- `idempotency_key` TEXT, nullable — unique per user, used for deduplicating retries
- `created` INTEGER, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`

The primary key SHALL be the composite `(user_id, seq)`. A unique index SHALL exist on `(user_id, idempotency_key)`. Deleting an auth user SHALL cascade-delete that user's `updates` rows.

The worker SHALL derive `user_id` for every sync query from the authenticated session user id rather than from a hard-coded prototype value.

#### Scenario: Schema present after first migration

- **WHEN** migrations are applied to a fresh D1
- **THEN** the `updates` table exists with the columns, primary key, foreign key, cascade behavior, and unique index listed above

#### Scenario: Sync rows are partitioned by authenticated user

- **WHEN** two different authenticated users perform sync operations
- **THEN** their update rows are stored and queried under different `user_id` values derived from the worker session

#### Scenario: Deleting user cascades sync rows

- **WHEN** an auth user with existing `updates` rows is deleted
- **THEN** D1 SHALL remove that user's `updates` rows through the foreign key cascade

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

### Requirement: Session-gated worker routes

The worker SHALL require an authenticated session for exchange-rate routes and sync routes. Session identity SHALL be derived from the server-side `better-auth` session tied to the incoming HttpOnly cookie.

#### Scenario: Exchange-rate route accepts authenticated session

- **WHEN** an authenticated request reaches an exchange-rate endpoint
- **THEN** the worker allows the request without requiring a local-user assertion header

#### Scenario: Protected route rejects missing session

- **WHEN** a request reaches a protected exchange-rate or sync endpoint without a valid authenticated session
- **THEN** the worker responds with `401 Unauthorized`
- **AND** the JSON body includes a machine-readable error code indicating unauthorized access

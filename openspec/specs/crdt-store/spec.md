## Purpose

Define local-first CRDT application state, persistence, cross-tab propagation, and server sync protocols.

## Requirements

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

- **WHEN** the application starts and IndexedDB contains prior Y.Doc state
- **THEN** the React tree mounts only after persistence has finished loading and the document reflects the persisted content on the first render

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

### Requirement: Selector-based React hook for reading Y.Doc state

The system SHALL expose a `useYDoc(selector, isEqual?)` hook that reads a slice of the Y.Doc using the caller's selector function and re-renders only when the equality function reports a change. The hook SHALL subscribe to the document's `afterTransaction` event and SHALL be implemented on top of `useSyncExternalStoreWithSelector` from `use-sync-external-store/with-selector`. When callers omit `isEqual`, the hook SHALL default to `shallowEqual`. Callers SHALL design selectors to return shallow-friendly projections such as primitives, flat objects, or minimal arrays of flat items.

#### Scenario: Selector returns a primitive

- **WHEN** a component subscribes via `useYDoc((doc) => doc.getMap('books').size)`
- **THEN** the component re-renders only when the size of the books map changes

#### Scenario: Selector uses default shallow equality for flat objects

- **WHEN** a component subscribes via `useYDoc((doc) => ({ locale: doc.getMap('user').get('locale') }))` and an unrelated field changes in the document
- **THEN** the component SHALL NOT re-render because the selector result remains shallow-equal to the previous render

#### Scenario: Selector returns an array with shallow equality

- **WHEN** a component subscribes via `useYDoc(selector, shallowEqual)` where the selector returns an array of primitives
- **THEN** the component re-renders only when the array's elements differ from the previous render

#### Scenario: Many small edits within one transaction trigger one render

- **WHEN** code performs multiple `Y.Map.set` and `Y.Array.push` operations inside a single `ydoc.transact(() => …)` block
- **THEN** subscribed components re-render at most once per transaction (because the hook subscribes to `afterTransaction`, not to per-edit `update` events)

### Requirement: Book-backed Yjs state is accessed without provider wrappers

The system SHALL read book-backed application state directly from the shared Yjs document through selector-based subscriptions and SHALL mutate that state through domain commands that accept the doc instance. The system SHALL NOT require a React provider or context wrapper dedicated to the books domain.

#### Scenario: Book library reads from selector-based subscriptions

- **WHEN** the book library, dashboard, setup flow, or breadcrumb UI needs book-backed state
- **THEN** each consumer SHALL derive only the slice it needs from the shared Yjs document
- **AND** no dedicated books provider SHALL be required in the runtime tree

#### Scenario: Book mutations run as domain commands

- **WHEN** the user creates, removes, or updates a book-backed field such as `favorite`
- **THEN** the write SHALL be performed through a books-domain command that receives the Yjs document
- **AND** the command SHALL apply its related Yjs writes within a transaction

### Requirement: Web Locks leader election

The system SHALL use the Web Locks API to elect exactly one tab per origin as the "leader" for network sync, by acquiring an exclusive lock named `autokpo-leader`. `acquireLeadership()` returns a `{ promise, cancel() }` object — the promise resolves when the lock is acquired, and `cancel()` releases the lock. `isLeader()` returns whether the current tab holds the lock.

#### Scenario: Single tab is leader

- **WHEN** one tab is open
- **THEN** that tab acquires the `autokpo-leader` lock and acts as the leader

#### Scenario: Second tab waits in the queue

- **WHEN** a second tab opens while the first holds the leader lock
- **THEN** the second tab does not acquire the lock and acts as a follower

#### Scenario: Leadership transfers when leader closes

- **WHEN** the current leader's tab is closed
- **THEN** the next-queued tab acquires the lock and becomes the new leader without page reload

#### Scenario: Cancelled leadership

- **WHEN** `cancel()` is called on the leadership object
- **THEN** `isLeader()` returns `false` and the lock is released, allowing a queued tab to acquire it

### Requirement: IndexedDB cache contents are encrypted

The system SHALL persist Yjs update bytes in IndexedDB only as AES-256-GCM encrypted envelopes using a dedicated local persistence DEK, distinct from the remote sync DEK. Each envelope SHALL include `schemaVersion: 1`, `kind: "update" | "snapshot"`, generated `id`, `encryptionAlgorithm: "aes-256-gcm"`, `encryptionVersion: 1`, `encryptionKeyId`, a random 12-byte `iv`, and `ciphertext`. AES-GCM AAD SHALL be the UTF-8 encoding of `autokpo:yjs-indexeddb:v1:<dbName>:updates:<kind>:<id>:<keyId>`.

#### Scenario: Yjs update is stored as ciphertext

- **WHEN** the system explicitly persists a local or pulled remote Yjs update
- **THEN** the system SHALL encrypt the update bytes using the active local persistence DEK
- **AND** SHALL append only the encrypted envelope to the IndexedDB `updates` store
- **AND** SHALL NOT use the remote sync DEK for the local IndexedDB row

#### Scenario: Unsupported encrypted cache envelope is rejected

- **WHEN** IndexedDB contains an update envelope with an unsupported `schemaVersion`, `kind`, `encryptionAlgorithm`, or `encryptionVersion`
- **THEN** the system SHALL NOT apply that row's ciphertext to the Y.Doc
- **AND** SHALL treat the local cache as absent or broken

#### Scenario: AAD binds cache ciphertext to database, row, kind, and key

- **WHEN** a cache ciphertext encrypted for one database name, envelope id, envelope kind, or encryption key id is decrypted using AAD for another database name, envelope id, envelope kind, or key id
- **THEN** AES-GCM authentication SHALL fail
- **AND** the system SHALL treat the local cache as absent or broken

### Requirement: Cross-tab Y.Doc fan-out via BroadcastChannel and IndexedDB

The system SHALL propagate Yjs update bytes between tabs of the same origin so that an edit made in one tab is reflected in all other open tabs. Live open-tab propagation SHALL use `BroadcastChannel` for low-latency UI updates, while encrypted IndexedDB persistence SHALL provide durable startup/reload recovery. BroadcastChannel-applied updates SHALL be memory-only in receiving tabs and SHALL NOT be persisted again by those tabs. The system SHALL accept that idempotent `Y.applyUpdate` makes duplicate delivery safe.

#### Scenario: Edit in tab B appears in tab C

- **WHEN** the user edits an entry in tab B while tabs A (leader) and C are also open
- **THEN** tab B SHALL explicitly persist the resulting Yjs update bytes to encrypted IndexedDB persistence
- **AND** tabs A and C SHALL apply the resulting Yjs update bytes from BroadcastChannel in memory
- **AND** subscribed components in those tabs SHALL re-render to reflect the change

#### Scenario: Origin tag prevents echo loops

- **WHEN** a tab receives Yjs update bytes from `BroadcastChannel` or from a server fetch and applies them
- **THEN** the application SHALL call `Y.applyUpdate` with an origin ignored by local dirty/broadcast side effects
- **AND** the update event listener SHALL ignore updates whose origin represents BroadcastChannel or remote replay

#### Scenario: Persistence replays do not re-persist themselves

- **WHEN** encrypted IndexedDB persistence decrypts and applies cached Yjs update bytes to the document during startup
- **THEN** the application SHALL apply those bytes with an origin ignored by local persistence side effects
- **AND** SHALL NOT persist those replayed updates again

#### Scenario: Broadcast echo is not redundantly persisted

- **WHEN** tab C receives a BroadcastChannel update that originated from tab B
- **THEN** tab C SHALL apply the update to its in-memory Y.Doc
- **AND** tab C SHALL NOT append that update to encrypted IndexedDB persistence

### Requirement: IndexedDB update log compaction

The system SHALL compact the encrypted IndexedDB update log after 500 stored updates by writing an encrypted full Yjs snapshot and deleting older update rows. Compaction SHALL rotate the local persistence DEK and SHALL commit the new active local key, compacted snapshot, and deletion of covered update rows in a single IndexedDB readwrite transaction. Compaction SHALL preserve the current Y.Doc state while reducing future startup replay work.

#### Scenario: Update log reaches compaction threshold

- **WHEN** encrypted IndexedDB persistence reaches 500 stored updates
- **THEN** the system SHALL encode the current Y.Doc state as a full Yjs update
- **AND** SHALL generate and MEK-wrap a new local persistence DEK
- **AND** SHALL encrypt the snapshot with the new local persistence DEK
- **AND** SHALL commit the new active local key, append the encrypted snapshot, and delete older update rows that are covered by the snapshot in one IndexedDB transaction

#### Scenario: Compacted cache rehydrates equivalent document state

- **WHEN** the application restarts after IndexedDB compaction
- **THEN** encrypted persistence SHALL decrypt and apply the remaining update rows using the active local persistence DEK
- **AND** the hydrated Y.Doc state SHALL match the state that existed when compaction completed plus any later persisted updates

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

### Requirement: Event-driven sync with React Query

The system SHALL use React Query (`@tanstack/react-query`) as the network layer. Pull is a `useQuery` and push/compact are `useMutation` hooks. All three are encapsulated inside `useSyncEngine()` — feature code never calls HTTP functions directly.

#### Scenario: Pull uses React Query with staleTime

- **WHEN** the sync engine mounts as the leader tab
- **THEN** it uses `useQuery` with `queryKey: ['sync']`, `staleTime: 5 minutes`, `refetchOnWindowFocus: true`, `refetchOnReconnect: true`
- **AND** the `queryFn` reads `syncState.read().cursor` inside the fetch function to get the current cursor for `If-None-Match`

#### Scenario: Push uses React Query mutation with retry

- **WHEN** a push mutation is triggered
- **THEN** it uses `useMutation` with exponential backoff retry (up to 3 attempts, capped at 30 s delay), skipping retry on 413 errors

#### Scenario: Followers send sync requests via BroadcastChannel

- **WHEN** a follower tab's pull query is enabled
- **THEN** it posts `request-sync` on BroadcastChannel instead of making a network request, because only the leader talks to the server

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

### Requirement: Push protocol (POST with JSON body and push-as-poll)

The system SHALL push local changes using `POST /api/sync` with `Content-Type: application/json` and an `X-Local-User-Id` header. The request body SHALL be a JSON object `{ "id": string, "encryptionKeyId": string, "encryptionAlgorithm": "aes-256-gcm", "encryptionVersion": number, "iv": string, "ciphertext": string }` where `id` is a UUID generated per logical push (reused across retries), `encryptionKeyId` is the active encryption key id, and `ciphertext` is the base64-encoded encrypted ciphertext. The `Idempotency-Key` header is removed — the idempotency id is in the body.

**Delta computation:** `computeDelta(doc, stateVector)` (exported from `src/crdt/sync-logic.ts`) returns `Y.encodeStateAsUpdate(doc)` (full state) if `stateVector` is `null` (post-410 recovery), otherwise `Y.encodeStateAsUpdate(doc, stateVector)` (the diff since the last-acked state vector). The delta is encrypted before being base64-encoded into the body.

**Dirty flag:** `hasPendingChanges(state)` (exported from `src/crdt/sync-logic.ts`) returns `true` if `stateVector === null || dirty === true`. The `dirty` flag is set by every local Y.Doc update and cleared after a contiguous push success. This handles delete-only edits that don't advance the state vector.

**Push debounce:** local changes schedule a push after `PUSH_DEBOUNCE_MS = 2000`; rapid edits within the debounce window coalesce into a single delta.

**Large delta fallback:** if the plaintext `delta.byteLength > MAX_PLAINTEXT_DELTA_BYTES` (1 MiB), the engine sends a compact (full snapshot) instead of a push.

**Push-as-poll contiguity check:** after push success, the engine computes `prevHead = assignedSeq - 1` (dense monotonic sequence). If `prevHead === cursor`, the push is contiguous — advance cursor, update stateVector, clear dirty. If `prevHead > cursor`, other devices appended in the gap — do NOT write sync state, instead invalidate the pull query to reconcile.

#### Scenario: Push sends JSON body with id and encrypted ciphertext

- **WHEN** the leader issues `POST /api/sync`
- **THEN** the request body SHALL be `application/json` with `id`, `encryptionKeyId`, `encryptionAlgorithm`, `encryptionVersion`, `iv` (base64), and `ciphertext` (base64) fields
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

### Requirement: sync_record table stores encrypted blobs with key reference

The D1 database SHALL store sync data in a `sync_record` table. Each row SHALL have a single-column UUID primary key `id`, a `user_id` FK to the `user` table, a monotonic `seq` integer, `encryption_algorithm TEXT NOT NULL`, `encryption_version INTEGER NOT NULL`, `iv BLOB NOT NULL`, `ciphertext BLOB NOT NULL`, a `kind` (`update` | `snapshot`), an `encryption_key_id` FK to `user_encryption_key`, and a `created` timestamp. A unique index on `(user_id, seq)` enforces ordering integrity.

#### Scenario: Push inserts a sync_record row with encryption_key_id

- **WHEN** a push request is accepted
- **THEN** the server SHALL insert a row into `sync_record` with the provided `id`, assigned `seq`, encrypted ciphertext, `kind = 'update'`, and `encryption_key_id`

#### Scenario: Compact inserts a sync_record snapshot row

- **WHEN** a compact request is accepted
- **THEN** the server SHALL insert a row into `sync_record` with `kind = 'snapshot'` and the provided `encryption_key_id`

### Requirement: Single-writer-to-network discipline

Only the leader tab SHALL perform HTTP requests to `/api/sync*`. Followers SHALL communicate intents (sync requests, local update bytes) to the leader exclusively via `BroadcastChannel`.

#### Scenario: Followers do not call the network

- **WHEN** a follower tab needs the latest server state (e.g. on focus or window becoming visible)
- **THEN** the follower posts `request-sync` on BroadcastChannel and does not itself issue a `GET /api/sync` request

### Requirement: No polling — event-driven sync triggers

The system SHALL NOT use periodic timers or heartbeat polling. Sync is triggered by:

- Leader lock acquisition (initial pull)
- `refetchOnWindowFocus` and `refetchOnReconnect` (React Query built-in)
- BroadcastChannel `request-sync` from followers
- Local Y.Doc edits (debounced push)
- Post-pull push-if-pending check inside the pull `queryFn`
- Manual `post({ type: 'request-sync' })` from UI

#### Scenario: No timer-based polling

- **WHEN** the application is open and idle with no user-visible events
- **THEN** the system makes no scheduled HTTP requests to `/api/sync*`

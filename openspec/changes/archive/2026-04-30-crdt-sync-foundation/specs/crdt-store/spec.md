## ADDED Requirements

### Requirement: Single Yjs document for application state

The system SHALL store all cross-device application state — books, entries, per-book entity profiles, per-book signatures, and the user's locale — in a single Yjs document persisted to IndexedDB via `y-indexeddb`. Theme preference SHALL remain in `localStorage` as a per-device setting and SHALL NOT be part of the Y.Doc.

#### Scenario: Y.Doc structure on first start

- **WHEN** the application boots for the first time on a device with no prior IndexedDB state
- **THEN** the system creates a Y.Doc containing top-level Y.Maps named `meta`, `user`, and `books`, sets `meta.schemaVersion = 1` and `meta.createdAt` to the current ISO timestamp, and persists it to IndexedDB

#### Scenario: Locale defaulted on first start

- **WHEN** the Y.Doc has no `user.locale` value after IndexedDB has finished syncing
- **THEN** the system sets `user.locale` to `'sr-Latn'` (the application's default locale)

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

The system SHALL await `y-indexeddb`'s `whenSynced` before mounting the React tree, so the first render reads from a fully hydrated Y.Doc and never flashes empty state.

#### Scenario: Hydration completes before render

- **WHEN** the application starts and IndexedDB contains prior Y.Doc state
- **THEN** the React tree mounts only after persistence has finished loading and the document reflects the persisted content on the first render

### Requirement: Selector-based React hook for reading Y.Doc state

The system SHALL expose a `useYDoc(selector, isEqual?)` hook that reads a slice of the Y.Doc using the caller's selector function and re-renders only when the equality function reports a change. The hook SHALL subscribe to the document's `afterTransaction` event and SHALL be implemented on top of `useSyncExternalStoreWithSelector` from `use-sync-external-store/with-selector`. The hook SHALL NOT use `useMemo` or `useCallback` (the React Compiler is enabled).

#### Scenario: Selector returns a primitive

- **WHEN** a component subscribes via `useYDoc((doc) => doc.getMap('books').size)`
- **THEN** the component re-renders only when the size of the books map changes

#### Scenario: Selector returns an array with shallow equality

- **WHEN** a component subscribes via `useYDoc(selector, shallowEqual)` where the selector returns an array of primitives
- **THEN** the component re-renders only when the array's elements differ from the previous render

#### Scenario: Many small edits within one transaction trigger one render

- **WHEN** code performs multiple `Y.Map.set` and `Y.Array.push` operations inside a single `ydoc.transact(() => …)` block
- **THEN** subscribed components re-render at most once per transaction (because the hook subscribes to `afterTransaction`, not to per-edit `update` events)

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

### Requirement: Cross-tab Y.Doc fan-out via BroadcastChannel and IndexedDB

The system SHALL propagate Yjs update bytes between tabs of the same origin so that an edit made in one tab is reflected in all other open tabs. Propagation SHALL use both `BroadcastChannel` (for low-latency UI updates) and `y-indexeddb` cross-tab observers (for durability), accepting that idempotent `Y.applyUpdate` makes duplicate delivery safe.

#### Scenario: Edit in tab B appears in tab C

- **WHEN** the user edits an entry in tab B while tabs A (leader) and C are also open
- **THEN** tabs A and C apply the resulting Yjs update bytes and any subscribed components in those tabs re-render to reflect the change

#### Scenario: Origin tag prevents echo loops

- **WHEN** a tab receives Yjs update bytes from `BroadcastChannel` or from a server fetch and applies them
- **THEN** the application calls `Y.applyUpdate(doc, bytes, REMOTE_ORIGIN)` where `REMOTE_ORIGIN` is a module-private `Symbol('autokpo:remote')` exported from `src/crdt/sync-logic.ts`, and its `update` event listener ignores updates whose origin is `REMOTE_ORIGIN`

### Requirement: Sync state side-channel in localStorage

The system SHALL persist sync metadata (cursor, state vector, dirty flag) in `localStorage` under the key `autokpo:sync` as a single JSON object, entirely separate from the Y.Doc. This side-channel stores per-device relationship-to-server state that is meaningless when merged across devices.

The stored state SHALL contain:

- `cursor: number` — the last server sequence number successfully applied (0 means "fresh")
- `stateVector: string | null` — base64-encoded `Y.encodeStateVector(doc)`, or `null` until the first successful push ack
- `dirty: boolean` — whether local changes exist that haven't been pushed yet (handles delete-only edits that don't advance the state vector)

Operations:

- `read() → { cursor, stateVector (Uint8Array | null), dirty }` — parses JSON, decodes base64 stateVector
- `write({ cursor, stateVector, dirty })` — encodes stateVector to base64, stringifies, single `localStorage.setItem`
- `markDirty()` — reads current state, sets `dirty: true`, preserves cursor and stateVector
- `reset()` — sets `cursor: 0`, `stateVector: null`, preserves `dirty` flag (used on 410 Gone recovery so pending local edits are still pushed)

Writing `cursor` and `stateVector` together in one `setItem` gives transactional semantics for free — a crash between updating either one is impossible.

#### Scenario: Round-trip fidelity

- **WHEN** `write({ cursor: 42, stateVector: sv, dirty: true })` is called and then `read()` is called
- **THEN** the returned `cursor` is 42, `stateVector` is the same `Uint8Array`, and `dirty` is `true`

#### Scenario: Reset preserves dirty flag for 410 recovery

- **WHEN** the sync state has `cursor: 100, dirty: true` and `reset()` is called
- **THEN** the state becomes `{ cursor: 0, stateVector: null, dirty: true }` — the cursor is reset for a full re-pull, but the dirty flag ensures pending local edits will be pushed after recovery

#### Scenario: Default state on fresh install

- **WHEN** `read()` is called and no `autokpo:sync` key exists in localStorage
- **THEN** the result is `{ cursor: 0, stateVector: null, dirty: false }`

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

### Requirement: Pull protocol (GET with ETag and binary stream)

The system SHALL pull updates from the server using `GET /api/sync` with an `If-None-Match` header containing the current cursor. There is no `?since=` query parameter.

- On `200`: apply all records to the Y.Doc using `applyRecordsToDoc()` (from `src/crdt/sync-logic.ts`, which wraps them in a single `ydoc.transact()` with `REMOTE_ORIGIN`), then post each record as `remote-update` on BroadcastChannel, write `syncState.write({ cursor: max(head, freshCursor), stateVector, dirty })` after the transact returns, and call `schedulePushIfPendingChanges()` to schedule a push if there are pending local edits.
- On `304`: nothing to do.
- On `410`: call `syncState.reset()` (zeros cursor, nulls stateVector, preserves dirty) and rethrow. React Query retries immediately once (with cursor = 0, no `If-None-Match`), pulling from scratch. The Y.Doc is NOT touched on 410 — local offline edits survive the subsequent merge.

#### Scenario: Pull after startup with stale data on server

- **WHEN** the leader pulls and receives a 410 Gone response
- **THEN** it calls `syncState.reset()` (preserving the dirty flag) and retries the pull immediately with no `If-None-Match` header, which fetches the snapshot and tail from scratch

#### Scenario: Pull applies records atomically

- **WHEN** the leader receives 3 records in a 200 response
- **THEN** all three are applied to the Y.Doc inside a single `ydoc.transact()` call, so partial application is impossible

#### Scenario: Pull re-reads sync state after async gap

- **WHEN** a pull query succeeds and the leader writes sync state
- **THEN** it re-reads sync state after the async `fetch` gap to avoid clobbering a concurrent push that may have advanced the cursor or set dirty

### Requirement: Push protocol (POST with idempotency key and push-as-poll)

The system SHALL push local changes using `POST /api/sync` with an `Idempotency-Key` header (a UUID generated per logical push, reused across retries).

**Delta computation:** `computeDelta(doc, stateVector)` (exported from `src/crdt/sync-logic.ts`) returns `Y.encodeStateAsUpdate(doc)` (full state) if `stateVector` is `null` (post-410 recovery), otherwise `Y.encodeStateAsUpdate(doc, stateVector)` (the diff since the last-acked state vector).

**Dirty flag:** `hasPendingChanges(state)` (exported from `src/crdt/sync-logic.ts`) returns `true` if `stateVector === null || dirty === true`. The `dirty` flag is set by every local Y.Doc update and cleared after a contiguous push success. This handles delete-only edits that don't advance the state vector.

**Push debounce:** local changes schedule a push after `PUSH_DEBOUNCE_MS = 2000`; rapid edits within the debounce window coalesce into a single delta.

**Large delta fallback:** if `delta.byteLength > MAX_BLOB_BYTES` (1 MiB), the engine sends a compact (full snapshot) instead of a push.

**Push-as-poll contiguity check:** after push success, the engine computes `prevHead = assignedSeq - 1` (dense monotonic sequence). If `prevHead === cursor`, the push is contiguous — advance cursor, update stateVector, clear dirty. If `prevHead > cursor`, other devices appended in the gap — do NOT write sync state, instead invalidate the pull query to reconcile. After the pull succeeds, pending changes are checked and pushed if needed.

#### Scenario: Burst of N rapid edits coalesces into one push

- **WHEN** the user makes 5 rapid edits within the 2-second debounce window
- **THEN** a single push fires with a delta encoding all 5 edits computed from the state vector at debounce time

#### Scenario: Push detects concurrent appends (gap)

- **WHEN** a push succeeds with `assignedSeq = 15` and the current cursor is 12
- **THEN** the engine computes `prevHead = 14`, sees `prevHead > cursor`, and does NOT write sync state — instead it invalidates the pull query to fetch the gap rows

#### Scenario: Push sends full state after 410 recovery

- **WHEN** the sync state has `stateVector: null` after a 410 reset
- **THEN** `computeDelta()` returns `Y.encodeStateAsUpdate(doc)` (full state) and `hasPendingChanges()` returns `true`

#### Scenario: Large delta triggers compact instead

- **WHEN** `computeDelta()` returns a delta larger than 1 MiB
- **THEN** the engine sends a compact (full snapshot) instead of a push

### Requirement: Compact protocol (POST /api/sync/compact with binary body)

The system SHALL produce a Yjs snapshot via `Y.encodeStateAsUpdate(doc)` and POST it to `/api/sync/compact` with `Content-Type: application/octet-stream`, `Idempotency-Key`, and `X-Replaces-Up-To` headers.

**Triggers for compaction:**

- The server includes `X-Compact-Hint: please` in a push response (only when the push was contiguous — `prevHead === cursor`).
- A push delta exceeds `MAX_BLOB_BYTES` (fallback to compact).

**Post-compact contiguity check:** same as push — if `prevHead === cursor`, write sync state; if not, invalidate pull query. After a contiguous compact, `schedulePushIfPendingChanges()` (from `src/crdt/sync-logic.ts`) checks whether dirty edits arrived during the async compact cycle.

#### Scenario: Compact on server hint

- **WHEN** the leader receives a `200` response from `POST /api/sync` with header `X-Compact-Hint: please`
- **THEN** the leader produces a snapshot and POSTs it to `/api/sync/compact` with `X-Replaces-Up-To` set to the push's `assignedSeq`

#### Scenario: Compact NOT triggered on gap detection

- **WHEN** a push succeeds but `prevHead > cursor` (gap detected)
- **THEN** the engine does NOT compact even if the push response included `X-Compact-Hint`, because another device likely already compacted the server data

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

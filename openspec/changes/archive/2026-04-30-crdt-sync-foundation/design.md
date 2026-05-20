## Context

AutoKPO is a client-side PWA whose state today lives in a single Yjs `Y.Doc` persisted to IndexedDB via `y-indexeddb`, with cross-device sync through a Cloudflare Worker backed by D1. Books, entries, profiles, signatures, and locale all live in the Y.Doc; theme stays in `localStorage`.

A Cloudflare Worker (`worker/main.ts`, Hono on the SPA same-origin) already exists with a working dev/test loop (`@cloudflare/vite-plugin`, `@cloudflare/vitest-pool-workers`). The free-tier constraint means we cannot rely on Durable Objects, WebSockets, or aggressive polling.

Constraints we are designing against:

- **E2EE-ready** wire format from day one — server treats payloads as opaque blobs even though Phase 0 ships them in plaintext.
- **Free tier**: D1 is the only Cloudflare storage primitive on the free plan whose write quota and consistency model fit an append log.
- **One real user, possibly several devices, possibly several tabs per device**, with offline edits expected on each.
- **No timer polling** — sync is event-driven (focus, reconnect, manual button) to stay deep inside the request budget.
- **React Compiler is enabled** — components and hooks must not hand-write `useMemo`/`useCallback`.

## Goals / Non-Goals

**Goals:**

- Deterministic merge of concurrent offline edits across tabs and devices via Yjs.
- Single Y.Doc representing the entire app state, persisted to IndexedDB via `y-indexeddb`.
- Instant cross-tab updates within a device (`BroadcastChannel` + IndexedDB observer fallback).
- Single-writer-to-network discipline via Web Locks leader election.
- Three minimal HTTP endpoints (`GET /api/sync`, `POST /api/sync`, `POST /api/sync/compact`) backed by D1 and Drizzle, with binary wire format, ETag-based incremental pulls, idempotency keys, and compact tail retention.
- Drizzle migrations applied uniformly across local dev (`pnpm db:migrate:local`), tests (Vitest pool), and production (`pnpm db:migrate:remote`).

**Non-Goals:**

- Authentication / multi-tenant identity (Phase 1).
- End-to-end encryption of blob payloads (Phase 2).
- Presence / awareness (e.g. seeing other tabs' cursors).
- Conflict-resolution UI — Yjs's automatic merge is considered correct.
- A migration path from current `localStorage` shape; the app is unreleased and existing keys are cleared.
- WebSockets / push delivery; pull-on-event is sufficient.
- History / time-travel as a product feature.

## Decisions

### CRDT library: Yjs (not Automerge)

Yjs's wire format is significantly more compact, which matters because every push and pull crosses a request-budgeted Worker. Field-level merge on `Y.Map` covers our concurrent-edit cases. Automerge's strengths (built-in history, better immutable React story) are unused here since we explicitly don't want history and are writing our own React hook anyway.

**Alternatives considered:** Automerge (rejected: larger updates, history we don't need); custom OT (rejected: massive scope).

### One Y.Doc for the whole app

Simplifies the leader/sync protocol (one cursor, one stream of updates) and the schema-versioning story. Per-component subscription granularity is achieved via observer-on-subtree + selector equality, not via separate documents.

**Schema** (top-level fields inside the single `Y.Doc`):

```
ydoc
├── meta             : Y.Map { schemaVersion: number, createdAt: ISO string }
├── user             : Y.Map { locale: 'sr-Latn' | 'en' | 'ru' }
├── books            : Y.Map<bookId, Y.Map>
│     ├── id         : string (uuid, mirrors map key)
│     ├── year       : number
│     ├── createdAt  : ISO string
│     ├── favorite   : boolean
│     ├── profile    : Y.Map | absent      // fields: pib, obveznik, firmaRadnje,
│     │                                    //         sediste, sifraPoreskogObveznika,
│     │                                    //         sifraDelatnosti
│     ├── signature  : Y.Map | absent      // fields: sastavioIme, odgovornoLiceIme
│     └── entries    : Y.Array<Y.Map>      // each entry has id, datumPrometa,
│                                          // opisPrometa, odProdajeProizvoda,
│                                          // odIzvrsenihUsluga
```

`theme` stays in `localStorage` because it is intentionally per-device. `entries` is a `Y.Array<Y.Map>` so concurrent edits to different fields of the same entry merge field-by-field. `opisPromota` is a plain `string`, not `Y.Text` — we are not editing prose collaboratively. Absence (no key) is preferred over `null` for optional sub-maps.

### Selector hook over `useSyncExternalStoreWithSelector`

`useYDoc(selector, isEqual?)` subscribes to the root doc on `afterTransaction` (batched, not per-microedit), reads via the user-supplied selector, and uses the selector-aware variant from `use-sync-external-store/with-selector` (the one React Redux uses) so referential equality is checked correctly under concurrent rendering. With the React Compiler, callers pass plain inline selectors.

**Alternative considered:** `automerge-repo-react`-style global subscription, rejected because it re-renders the whole tree on every change.

### Sync state side-channel (`localStorage`)

Sync metadata lives in `localStorage` under the key `autokpo:sync`, entirely separate from the Y.Doc. This is a side-channel — it describes _this device's_ relationship to the server log and is meaningless when merged across devices.

```ts
type SyncState = {
  cursor: number; // last applied server seq (0 = fresh)
  stateVector: string | null; // base64(Y.encodeStateVector(doc))
  dirty: boolean; // local changes not yet pushed
};
```

Writing cursor and stateVector together in one `localStorage.setItem` gives transactional semantics for free. The cursor is advanced only after Yjs bytes have been applied to the doc; if we crash between `applyUpdate` and `setItem`, the next pull re-fetches and re-applies, which is safe by Yjs idempotency.

**Why not in the Y.Doc?** Writing sync metadata into the doc would itself produce a Yjs update — recursive bloat where every push begets another push.

The `dirty` flag handles delete-only edits that don't advance the state vector. It's set on every local Y.Doc `update` event (origin ≠ `REMOTE_ORIGIN`) and cleared after a push that is contiguous with the server head (`prevHead === cursor`).

### Origin tag as module-private Symbol

Any update applied from the bus or from the server is tagged with `REMOTE_ORIGIN = Symbol('autokpo:remote')`. The doc's `update` event listener checks `origin === REMOTE_ORIGIN` and skips further processing. A string can collide with a user transaction origin; a Symbol cannot.

### Tab coordination via Web Locks + BroadcastChannel

One named lock (`autokpo-leader`, exclusive) decides the leader for the lifetime of the tab. `acquireLeadership()` returns `{ promise, cancel() }` — the promise resolves when the lock is granted; `cancel()` releases it. `isLeader()` returns a synchronous boolean.

Three BroadcastChannel message kinds carry Yjs update bytes between tabs:

- `local-update { bytes }` — emitted by any tab when its user causes a local Y.Doc edit.
- `remote-update { bytes }` — emitted by the leader after applying server-fetched updates.
- `request-sync` — emitted by a follower when `triggerSync()` is called; the leader invalidates its pull query.

`BroadcastChannel.postMessage` does not deliver to the sender's own `onmessage`, so a tab calling `triggerSync()` checks `isLeader()`: if leader, it invalidates the sync query directly; if follower, it posts `request-sync` to the bus for the leader to pick up.

`y-indexeddb`'s cross-tab observer is kept as redundancy: BroadcastChannel gives sub-second UI updates; the IDB observer gives durability if the channel is missed. Yjs `applyUpdate` is idempotent, so double-delivery is safe.

### Binary wire format

`GET /api/sync` returns a binary record stream, not JSON:

```
record := u32_be(seq) u8(kind) u32_be(len) bytes(len)
kind   := 0x01 update | 0x02 snapshot
```

No multipart, no base64, no JSON wrapping the blobs. The client reads the response as one `ArrayBuffer` and parses it in a tight loop.

`POST /api/sync` and `POST /api/sync/compact` send raw `application/octet-stream` with no envelope. Metadata (idempotency key, replaces-up-to, kind) goes in headers.

### ETag-based incremental pulls

`GET /api/sync` uses `If-None-Match: "<cursor>"` (standard HTTP ETag syntax) instead of a `?since=` query parameter. The server responds with:

- `200` + binary record stream + `ETag: "<head>"` when there are new rows
- `304 Not Modified` when the client's cursor matches the current head
- `410 Gone` when the client's cursor is stale (older than the earliest retained row) or impossibly ahead

On `410`, the client calls `resetSyncState()` (zeros cursor, nulls stateVector, preserves dirty) and re-pulls without `If-None-Match`. The Y.Doc is not touched — local offline edits survive the merge by Yjs construction.

### Three endpoints, append-only semantics

#### `GET /api/sync`

Pulls everything the client doesn't yet have. Uses `If-None-Match` for incremental pulls. No pagination — `HARD_CAP_BYTES` (4 MiB) bounds the worst-case response to fit in a single Worker response.

#### `POST /api/sync`

Appends a single update. Request body is raw `application/octet-stream`. Requires `Idempotency-Key` header for deduplication across retries. Returns `ETag` header with assigned seq (not JSON). Includes `X-Compact-Hint: please` when over soft caps. Rejects with `413` if blob exceeds `MAX_BLOB_BYTES` (1 MiB) or total storage exceeds `HARD_CAP_BYTES`.

**Push-as-poll:** The client reads `assignedSeq` from the ETag and computes `prevHead = assignedSeq - 1`. If `prevHead === cursor`, the push is contiguous and the client advances its cursor. If `prevHead > cursor`, other devices appended in the gap — the client invalidates its pull query to fetch the gap rows before advancing.

#### `POST /api/sync/compact`

Inserts a snapshot and atomically removes rows it replaces, but preserves a tail for incremental pulls. Requires `X-Replaces-Up-To` and `Idempotency-Key` headers. The `effective_cutoff = min(X-Replaces-Up-To, keep_cutoff)` clamp ensures the server never deletes rows the client hasn't merged, while still freeing enough storage to stay within quotas.

### React Query as the network layer

All three endpoints are wrapped in React Query hooks inside `useSyncEngine()`:

- **Pull**: `useQuery({ queryKey: ['sync'], staleTime: 5min, refetchOnWindowFocus: true, refetchOnReconnect: true })`. The `queryFn` reads cursor from `syncState.read()` inside the fetch. Non-leader tabs post `request-sync` on BroadcastChannel instead of fetching. After applying records and writing sync state, the `queryFn` calls `schedulePushIfPendingChanges()` to schedule a push if there are pending local edits — no separate cache subscription effect is needed. The exported `triggerSync(queryClient)` is the public API for manual sync: it checks `isLeader()` and either invalidates the sync query directly or posts `request-sync` via the bus.
- **Push**: `useMutation` with exponential backoff retry (3 attempts, capped at 30 s, no retry on 413). Idempotency-Key makes server-side retries safe.
- **Compact**: Same shape as push.

Pure logic helpers (`hasPendingChanges`, `computeDelta`, `applyRecordsToDoc`, `schedulePushIfPendingChanges`, `REMOTE_ORIGIN`) are extracted into `src/crdt/sync-logic.ts` for testability without React mocking.

React Query's `onlineManager` is the single source of truth for `navigator.onLine`. Feature code never calls `pull`/`push`/`compact` directly — it only reads from the Y.Doc.

### Server storage limits

| Constant                 | Value   | Purpose                                                   |
| ------------------------ | ------- | --------------------------------------------------------- |
| `MAX_BLOB_BYTES`         | 1 MiB   | Per-blob size limit on POST requests                      |
| `SOFT_CAP_ROWS`          | 200     | Row count threshold for `X-Compact-Hint`                  |
| `SOFT_CAP_BYTES`         | 2 MiB   | Byte count threshold for `X-Compact-Hint`                 |
| `HARD_CAP_BYTES`         | 4 MiB   | Total storage per user; rejects push with 413 if exceeded |
| `COMPACT_TAIL_MAX_ROWS`  | 50      | Max rows retained as incremental tail after compaction    |
| `COMPACT_TAIL_MAX_BYTES` | 256 KiB | Max bytes retained as incremental tail after compaction   |

These values ensure a full GET response never paginates: even a fresh device pulling everything is bounded by `HARD_CAP_BYTES` (4 MiB), comfortably below any single Worker response budget.

### Backend storage: D1 + Drizzle

D1 is the only free-tier CF storage primitive whose write quota (100 k writes/day) and strong consistency fit an append log. Drizzle provides the migrations workflow and type-safe queries.

**Schema** (one table, `worker/db/schema.ts`):

```sql
CREATE TABLE updates (
  user_id           TEXT NOT NULL,
  seq               INTEGER NOT NULL,
  blob              BLOB NOT NULL,
  kind              TEXT NOT NULL CHECK(kind IN ('update', 'snapshot')),
  idempotency_key   TEXT,              -- nullable, unique per user
  created           INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, seq)
);
CREATE UNIQUE INDEX updates_user_id_idempotency_key_idx
  ON updates(user_id, idempotency_key);
```

Phase 0 hardcodes `user_id = '0'` server-side; the client never sends or knows about it.

### Bootstrap sequence

```
on app start:
  1. open Y.Doc + y-indexeddb persistence
  2. await persistence.whenSynced
  3. if doc.user.locale missing → set to 'sr-Latn'
  4. mount React tree
  5. acquireLeadership() → on resolve, invalidate sync query → initial pull
  6. useSyncEngine() wires all listeners and mutations
```

No `localStorage`-to-Y.Doc hydration step: existing keys are cleared on first run.

## Risks / Trade-offs

- **No-polling pull-only sync delays multi-device propagation** until the second device focuses → acceptable for accounting workflow; user can hit the manual refresh button.
- **`getSnapshot` allocation cost in the selector hook** can cause infinite re-renders if naively implemented → Mitigation: use `useSyncExternalStoreWithSelector` with `shallowEqual` for object/array selectors; require selector return shapes that are referentially stable when content is unchanged.
- **`y-indexeddb` cross-tab observer + BroadcastChannel deliver each update twice** → safe because Yjs `applyUpdate` is idempotent; we accept the small duplicate-decode cost for redundancy.
- **Leader handover edge cases**: if the leader tab crashes mid-sync, the cursor in localStorage may not have been advanced → next leader re-fetches from the persisted cursor; idempotent `applyUpdate` makes this safe.
- **D1 free-tier write quota (100 k/day)** is generous for a single user, but a runaway compaction loop could burn it → soft cap is count-or-bytes, hard cap returns 413, and compaction is gated on a hint header and debounced.
- **Web Locks browser support** assumes Safari ≥ 16 / modern Chrome / Firefox. The PWA already targets modern browsers; no fallback.
- **Drizzle migrations are not auto-applied at worker cold start** → deliberately. CI/deploy runs the migration step; tests apply them via a helper.
- **410 Gone is a cost path, not a data-loss path**: a `410 Gone` response causes the client to reset its cursor and re-pull the snapshot, which merges into the existing local doc via `Y.applyUpdate`. Offline edits carry their own `(clientID, clock)` and survive the merge. The cost is one bigger-than-incremental round trip; correctness is unconditional.

## Migration Plan

The app is unreleased. Deploy steps:

1. Land worker schema + endpoints behind no feature flag (no traffic exists yet).
2. Run `pnpm db:migrate:remote` from CI on first deploy.
3. Client clears the three existing `localStorage` keys (`autokpo:books`, `autokpo:locale`) on first boot of the new build; `autokpo:theme` is preserved.
4. No rollback strategy needed beyond `git revert`. There is no production data to lose.

## Open Questions

None blocking implementation. Items deferred to later changes:

- Authentication / real `user_id` (Phase 1).
- Encryption envelope format and KDF parameters (Phase 2; planned: WebCrypto AES-GCM with Argon2id from a passphrase, with a leading version byte).
- Client UI for "you are viewing stale data" / "merge in progress" — current plan is to show no UI; CRDT merges are silent.

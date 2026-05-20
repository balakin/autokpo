## Why

Today AutoKPO persists state to `localStorage` per device, with no way to share data between tabs (changes don't propagate until reload) or between devices (no backend sync at all). We want a local-first, multi-device, offline-capable store that converges deterministically — and we want the backend to be a dumb opaque-blob proxy so end-to-end encryption can be layered on later without re-architecting the wire protocol.

## What Changes

- **BREAKING**: Replace `localStorage` persistence for books, entries, profile, signature, and locale with a single Yjs document persisted to IndexedDB. Theme remains in `localStorage` (per-device preference).
- **BREAKING**: Clear existing `localStorage` keys on first run after upgrade — the app is unreleased, no migration path is provided.
- Introduce a custom `useYDoc(selector)` hook (Redux-style) over `useSyncExternalStoreWithSelector`, subscribed to Yjs `afterTransaction` events.
- Add a Web Locks–based leader election so only one tab talks to the network. Followers exchange Yjs update bytes via `BroadcastChannel`; cross-tab IndexedDB observers act as a fallback.
- Drive sync from user-visible events (React Query's `refetchOnWindowFocus`/`refetchOnReconnect`, BroadcastChannel `request-sync`, local edits, manual `triggerSync()` call) instead of timer polling.
- Sync state (cursor, state vector, dirty flag) lives in `localStorage` under `autokpo:sync` as a single atomic JSON object, separate from the Y.Doc.
- Push protocol uses idempotency keys (`Idempotency-Key` header), `ETag` headers for assigned seq, and a "push-as-poll" contiguity check (`prevHead = assignedSeq - 1`) to detect concurrent appends.
- Pull uses `If-None-Match` ETag headers and a binary record stream wire format (no JSON, no base64 on the hot path).
- A `dirty` flag in sync state tracks delete-only edits that don't advance the state vector, ensuring they get pushed.
- Add a Cloudflare D1 binding plus three endpoints with binary wire format, idempotency, `410 Gone` for stale cursors, `415`/`409`/`413` error codes, and compact tail retention (`min(X-Replaces-Up-To, keep_cutoff)`).
- Add `drizzle-kit` + a migration directory; CI applies migrations via `wrangler d1 migrations apply`. Worker tests apply the same migrations to the in-memory D1 from `@cloudflare/vitest-pool-workers`.
- `REMOTE_ORIGIN` is a module-private `Symbol`, not a string, to prevent echo loops from user transaction origins.

Out of scope (future phases): real authentication / user identity, end-to-end encryption of update blobs, presence/awareness, conflict-resolution UI.

## Capabilities

### New Capabilities

- `crdt-store`: Client-side CRDT document, IndexedDB persistence, leader election, cross-tab fan-out, localStorage-backed sync state side-channel, event-driven sync triggers, `triggerSync(queryClient)` for manual sync (checks `isLeader()` — leader invalidates directly, follower posts `request-sync`), push-as-poll contiguity check, dirty flag, the React selector hook for reading slices of the document, and pure sync logic helpers (`hasPendingChanges`, `computeDelta`, `applyRecordsToDoc`, `schedulePushIfPendingChanges`, `REMOTE_ORIGIN`) extracted for testability.

### Modified Capabilities

- `cloudflare-worker`: Adds a D1 database binding, Drizzle ORM, idempotency-key unique index, binary record stream on GET, ETag/If-None-Match/410 Gone on GET, Idempotency-Key/Content-Length/Content-Type/409/415 on POST, binary body with headers on compact, and compact tail retention algorithm.

## Impact

- **Code**: New `src/crdt/` module (Y.Doc factory, selector hook, leader, BroadcastChannel bus, sync-state side-channel, sync-logic pure helpers, sync-engine hook with React Query, wire-format client). Existing providers rewritten on top of the Y.Doc. New `worker/db/` (Drizzle schema + migrations) and `worker/routes/sync.ts`.
- **Dependencies**: `yjs`, `y-indexeddb`, `use-sync-external-store`, `drizzle-orm`, `@tanstack/react-query`, `drizzle-kit` (dev).
- **Config**: `wrangler.jsonc` gains a `d1_databases` binding; `drizzle.config.ts` added at repo root.
- **CI/Deploy**: Pre-deploy step `pnpm db:migrate:remote`. Pre-commit/CI continues to run `pnpm check:worker-types`.
- **Tests**: Worker integration tests rewritten for binary wire format, ETag semantics, idempotency, 410 Gone, compact tail retention. App tests updated to use Y.Doc-backed test harness.
- **Storage limits**: D1 free tier (5 GB total, 100k writes/day) is the operative ceiling; per-user soft cap enforced via the compaction hint header.

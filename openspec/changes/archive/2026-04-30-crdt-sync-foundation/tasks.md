## Phase 1 — Dependencies and worker config

- [x] 1.1 Add runtime deps `yjs`, `y-indexeddb`, `use-sync-external-store`, `drizzle-orm`, `@tanstack/react-query`
- [x] 1.2 Add dev deps `drizzle-kit`, `@types/use-sync-external-store`
- [x] 1.3 Create the local D1 database via `pnpm wrangler d1 create autokpo` and copy the `database_id` into `wrangler.jsonc`
- [x] 1.4 Add the `d1_databases` block in `wrangler.jsonc` with `binding: "DB"` and `migrations_dir: "./worker/db/migrations"`
- [x] 1.5 Run `pnpm generate:worker-types` so `worker-configuration.d.ts` includes the `DB` binding
- [x] 1.6 Add `drizzle.config.ts` at repo root pointing at `worker/db/schema.ts` and `worker/db/migrations`

## Phase 2 — Worker DB layer and endpoints

- [x] 2.1 Create `worker/db/schema.ts` with the `updates` table (including `idempotency_key TEXT` nullable column, unique index on `(user_id, idempotency_key)`, `created INTEGER DEFAULT CURRENT_TIMESTAMP`)
- [x] 2.2 Add `worker/db/index.ts` exporting a `getDb(d1)` helper that wraps `drizzle(d1, { schema })`
- [x] 2.3 Generate the initial migration via `pnpm db:generate` and commit `worker/db/migrations/`
- [x] 2.4 Ensure `pnpm db:migrate:local` applies migrations to the local D1 instance

## Phase 3 — Worker sync endpoints (binary wire format)

- [x] 3.1 Add `worker/routes/sync.ts` exporting a Hono sub-app, mounted under `/api/sync` from `worker/main.ts`
- [x] 3.2 Implement `GET /api/sync` with `If-None-Match` ETag header, binary record stream response (`u32_be(seq) u8(kind) u32_be(len) bytes(len)`), `304 Not Modified`, and `410 Gone` for stale/impossible cursors
- [x] 3.3 Implement `POST /api/sync` with `Idempotency-Key` header (dedup or 409 Conflict), `Content-Type`/`Content-Length` validation (415/413), `INSERT ... SELECT ... HAVING` pattern for hard cap, `ETag` response header with assigned seq, `X-Compact-Hint` on soft cap
- [x] 3.4 Implement `POST /api/sync/compact` with binary body, `X-Replaces-Up-To` header, `Idempotency-Key`, compact tail retention algorithm (`effective_cutoff = min(replacesUpTo, keep_cutoff)`), idempotent duplicate handling, and `409` when `X-Replaces-Up-To > head`
- [x] 3.5 Hardcode `const USER_ID = '0'` for Phase 0 and use it in every query
- [x] 3.6 Define storage limit constants: `MAX_BLOB_BYTES=1MiB`, `SOFT_CAP_ROWS=200`, `SOFT_CAP_BYTES=2MiB`, `HARD_CAP_BYTES=4MiB`, `COMPACT_TAIL_MAX_ROWS=50`, `COMPACT_TAIL_MAX_BYTES=256KiB`

## Phase 4 — Worker tests

- [x] 4.1 Add `tests/worker/db-helpers.ts` exposing `applyMigrations(db)` that applies all migrations to the test D1
- [x] 4.2 Add `worker/__tests__/sync.spec.ts` covering: binary record stream parsing, `If-None-Match` → 304, stale/impossible cursor → 410, ETag header, idempotency key dedup/409, `Content-Length` guard → 413, `Content-Type` guard → 415, compact tail retention, hard cap → 413, soft cap → `X-Compact-Hint`
- [x] 4.3 Verify `pnpm test` runs both the app and worker projects green

## Phase 5 — Client sync state and wire format

- [x] 5.1 Create `src/crdt/sync-state.ts`: localStorage-backed `{cursor, stateVector (base64), dirty}` with `read()`, `write()`, `markDirty()`, `reset()` (zeros cursor/stateVector, preserves dirty flag)
- [x] 5.2 Create `src/crdt/sync-client.ts`: `pull({since})` with `If-None-Match` header and binary stream parsing, `push({delta, idempotencyKey})` with `Idempotency-Key`/`ETag`/`X-Compact-Hint`, `compact({snapshot, replacesUpTo, idempotencyKey})` with binary body and `X-Replaces-Up-To` header, `SyncGoneError` class, `parseRecordStream()` function
- [x] 5.3 Change origin tag from string `'remote'` to module-private `Symbol('autokpo:remote')` exported as `REMOTE_ORIGIN` from `use-sync-engine.ts`

## Phase 6 — Client sync engine

- [x] 6.1 Create `src/crdt/use-sync-engine.ts`: React hook wiring pull (`useQuery`), push (`useMutation`), and compact (`useMutation`) via React Query, with `staleTime: 5min`, `refetchOnWindowFocus`, `refetchOnReconnect`, exponential backoff retry (3 attempts, no retry on 413), and leader-only network activity
- [x] 6.2 Implement push-as-poll contiguity check: after push success, compute `prevHead = assignedSeq - 1`; if `prevHead === cursor`, advance cursor/stateVector and clear dirty; if `prevHead > cursor`, invalidate pull query to fetch gap
- [x] 6.3 Implement dirty flag tracking: `markDirty()` on every local Y.Doc update (origin ≠ `REMOTE_ORIGIN`), `dirty: false` after contiguous push success, `hasPendingChanges()` checks `stateVector === null || dirty === true`
- [x] 6.4 Implement 410 recovery: on `SyncGoneError`, call `resetSyncState()` (zeros cursor, nulls stateVector, preserves dirty) and rely on React Query retry (once, 0 delay) to pull from scratch
- [x] 6.5 Implement large-delta fallback: if `computeDelta().byteLength > MAX_BLOB_BYTES`, send compact (full snapshot) instead of push
- [x] 6.6 Implement post-pull push-if-pending: after a successful pull inside the `queryFn`, call `schedulePushIfPendingChanges()` if leader and there are pending changes (no separate cache subscription effect needed)
- [x] 6.7 Extract pure sync logic helpers (`hasPendingChanges`, `computeDelta`, `applyRecordsToDoc`, `schedulePushIfPendingChanges`, `REMOTE_ORIGIN`) from `use-sync-engine.ts` into `src/crdt/sync-logic.ts` and write tests in `src/crdt/__tests__/sync-logic.spec.ts`

## Phase 7 — Client infrastructure

- [x] 7.1 Create `src/crdt/bus.ts`: `BroadcastChannel('autokpo-bus')` with typed messages `local-update`, `remote-update`, `request-sync`
- [x] 7.2 Create `src/crdt/leader.ts`: `acquireLeadership()` returns `{ promise, cancel() }`, `isLeader()` returns boolean, `CancelledError` class
- [x] 7.3 Create `src/crdt/doc.ts`: singleton `Y.Doc` with `IndexeddbPersistence`, `whenReady` promise, `bootstrap()` for schema version / locale defaults
- [x] 7.4 Create `src/crdt/y.ts`: type-safe wrappers for `Y.Doc`, `Y.Map`, `Y.Array`, `encodeStateAsUpdate`, `encodeStateVector`, `applyUpdate`
- [x] 7.5 Create `src/crdt/use-y-doc.ts`: `useYDoc(selector, isEqual?)` on `useSyncExternalStoreWithSelector`, version counter incremented on `afterTransaction`
- [x] 7.6 Create `src/crdt/crdt-provider.tsx`: waits for `whenReady`, calls `bootstrap()`, renders `<SyncEngine />` (calls `useSyncEngine()`) and provides `DocContext`

## Phase 8 — Migrate features to Y.Doc

- [x] 8.1 Replace `src/books/books-storage.ts` and `src/books/books-provider.tsx` with Y.Doc-backed implementation
- [x] 8.2 Refactor `src/entries/entries-provider.tsx` so entries CRUD mutates the per-book `Y.Array<Y.Map>` directly
- [x] 8.3 Refactor `src/entity-profiles/entity-profile-provider.tsx` to mutate the active book's `profile` Y.Map
- [x] 8.4 Refactor `src/signatures/signature-provider.tsx` to mutate the active book's `signature` Y.Map
- [x] 8.5 Refactor `src/i18n/locale-provider.tsx` so locale reads/writes go through `user.locale` in the Y.Doc
- [x] 8.6 Leave `src/settings/theme-provider.tsx` unchanged (theme stays in `localStorage`)
- [x] 8.7 Mount `<CrdtProvider>` near the top of `src/main.tsx` so it wraps `<App>`
- [x] 8.8 Add a manual "Sync now" button in settings that calls `triggerSync(queryClient)` — which invalidates the sync query directly if leader, or posts `request-sync` via BroadcastChannel if follower

## Phase 9 — App test updates

- [x] 9.1 Add `tests/render-helpers.tsx` extension that mounts components against an in-memory Y.Doc (no IndexedDB)
- [x] 9.2 Update existing books/entries/entity-profile/signature/locale tests to use Y.Doc-backed providers
- [x] 9.3 Add tests: `useYDoc` selector shallow-equal, `afterTransaction` batching, `sync-state` round-trip and `reset()` preserving dirty, `parseRecordStream`, `pull`/`push`/`compact` wire functions, leader election

## Phase 10 — Build and verification

- [x] 10.1 `pnpm lint:fix` clean
- [x] 10.2 `pnpm build` clean
- [x] 10.3 `pnpm test` clean across both projects
- [x] 10.4 Manual smoke test in `pnpm dev`: open three tabs, edit in tab B, confirm tab C updates instantly; close the leader tab and confirm a follower takes over and that "Sync now" works

## Phase 11 — Deploy plumbing

- [x] 11.1 Add a CI step that runs `pnpm db:migrate:remote` before deploy (documented in `AGENTS.md`)
- [x] 11.2 Update `AGENTS.md` "Commands" section to include `pnpm db:generate`, `pnpm db:migrate:local`, `pnpm db:migrate:remote`, `pnpm check:worker-types`

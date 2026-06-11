## Why

A fresh client pulling a large sync history fell into an infinite local-DB write loop: the pull response's `head` was read from the `ETag` response header, which returned `0` (the header was present on the wire but `null` in `res.headers.get()` — a same-origin GET being served/revalidated through the browser HTTP cache). With `head = 0` the cursor never advanced (`Math.max(head, freshCursor)` stays `0`), so every pull re-fetched all rows and re-wrote them to IndexedDB, while each concurrent local edit pushed at cursor `0`, got gap-detected, and re-triggered the loop. The root cause is structural: the protocol requires the client to read client-bound data from **response headers**, which proxies, caches, and the conditional-GET machinery are free to drop, weaken, or hide from JS.

## What Changes

- **BREAKING (wire protocol):** The pull success path always returns `200` with a JSON body. Remove the `304 Not Modified` branch, the `If-None-Match` request header, and the `ETag` response header from the pull protocol.
- The pull cursor travels as a query parameter: `GET /api/sync?since=<n>` (with `X-Local-User-Id` still a request header). This reverses the prior "there is no `?since=` query parameter" rule, which existed only to support the conditional-GET/304 design being removed.
- All `/api/sync*` responses set `Cache-Control: no-store`, so the browser and intermediaries never cache or conditionally revalidate them.
- All client-bound signaling moves into JSON response bodies:
  - pull `200` → `{ records: [...], head: <number> }` (records is `[]` when nothing is newer than `since`).
  - push `200` → `{ assignedSeq: <number>, compactHint: <boolean> }` (replaces `ETag` + `X-Compact-Hint`).
  - compact `200` → `{ assignedSeq: <number> }` (replaces `ETag`).
- Client simplification: `parseETag` is removed; the pull `304` special-case is removed; the pull return shape stays `{ records, head, status }` but both values come from the body / `200`.
- **Unchanged:** HTTP verbs and paths (`GET /api/sync`, `POST /api/sync`, `POST /api/sync/compact`); request headers `X-Local-User-Id` and `X-Replaces-Up-To`; status codes `410 Gone`, `409` (`local_user_mismatch` / `write_conflict` / `idempotency_conflict`), `413`; all E2EE encryption, AAD, and idempotency rules; dense-monotonic per-user `seq`, the push-as-poll contiguity check (`prevHead = assignedSeq - 1`), and snapshot-baseline / fresh-pull-floor semantics.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `crdt-store`: The pull/push/compact wire protocol changes — pull becomes an always-`200` `GET /api/sync?since=<n>` with `head` in the body (no `If-None-Match`, `ETag`, or `304`); push/compact return `assignedSeq` / `compactHint` in the body instead of `ETag` / `X-Compact-Hint`; all sync responses set `Cache-Control: no-store`.

## Impact

- **Spec:** `openspec/specs/crdt-store/spec.md` — Pull protocol requirement + scenarios rewritten; push/compact response signaling rewritten; the "no `?since=` query parameter" statement flipped. (The spec's pre-existing drift on encryption record fields — `iv`/`encryptionVersion` vs the current `encryptionParams` envelope — is out of scope and left untouched.)
- **Docs:** `apps/app/docs/sync.md` — Pull-flow mermaid + rules drop the `304`/`ETag` arms; push/compact response arrows and the `X-Compact-Hint` rule become body fields; pull request line becomes `?since=`.
- **Worker:** `apps/app/worker/routes/sync.ts` — pull reads `since` from the query and always returns `{ records, head }`; push/compact return JSON bodies; all responses set `Cache-Control: no-store`.
- **Client:** `apps/app/src/crdt/sync-client.ts` — pull sends `?since=`, drops `If-None-Match`, reads `{ records, head }` from the body, removes `parseETag` and the `304` branch; push/compact read `assignedSeq` / `compactHint` from the body.
- **Tests:** `apps/app/worker/routes/__tests__/sync.spec.ts` and `apps/app/src/crdt/__tests__/sync-client.spec.ts` — `ETag`/`304` header assertions replaced with body assertions; `Cache-Control: no-store` assertions added.
- **Deployment / backward-compat:** The Worker serves the client bundle, so server + client deploy atomically. The only skew window is an installed PWA running a cached service worker (old client) against the new worker — the old client would send `If-None-Match` (ignored) and read `ETag` (no longer sent), reading `head = 0` and looping until the SW updates. Whether the new server should temporarily still accept `If-None-Match` as a cursor source and/or emit an informational `ETag` to keep stale clients limping is a design question resolved in `design.md`.
- **Related (already landed, out of scope):** the `pullInFlightRef` push-during-pull race guard and the `cursor ?? 0` normalization in `sync-state.ts` stay as-is. The interim "head in body with `ETag` fallback" edits are superseded by this change (the fallback is unnecessary once `head` is always in the body).

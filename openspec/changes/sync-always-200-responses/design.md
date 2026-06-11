## Context

The CRDT sync protocol signals client-bound data through HTTP response headers: pull returns the server head in `ETag`, push returns the assigned sequence in `ETag` and the compaction hint in `X-Compact-Hint`, and pull is a conditional `GET` driven by `If-None-Match`/`304`. In production this broke: a fresh client pulling a large history read `head` from `ETag` as `0` (the header was on the wire but `null` in `res.headers.get()` — a same-origin `GET` being served/revalidated through the browser HTTP cache). With `head = 0` the cursor never advanced, so the client re-pulled and re-wrote all rows to IndexedDB forever, and concurrent local edits pushed at cursor `0`, gap-detected, and re-triggered the loop.

The structural fault: the client is required to read data from **response headers**, which proxies, caches, and conditional-GET machinery may strip, weaken, or hide from JS. Request headers are never affected (the server always sees them); status codes are never affected (push reads `413`/`409`, pull reads `410` reliably). The fix moves all client-bound signaling into JSON response bodies and removes the conditional-GET path so the browser's HTTP cache is never involved.

Constraints:

- The Cloudflare Worker serves the client bundle, so server and client deploy atomically — but the PWA service worker uses `registerType: 'prompt'`, so an installed client adopts a new bundle only when the user accepts an update toast. Skew between a cached old client and the new worker is therefore **user-gated**, not automatic.
- The already-landed `pullInFlightRef` push-during-pull guard and `cursor ?? 0` normalization stay; they are defensive and orthogonal.

## Goals / Non-Goals

**Goals:**

- The client never reads client-bound data from a custom/non-simple response header.
- The pull `GET` is never cached or conditionally revalidated by the browser or an intermediary.
- Preserve every existing semantic: verbs/paths, request headers, status codes, encryption/AAD/idempotency, dense-monotonic `seq`, push-as-poll contiguity, snapshot baseline / fresh-pull-floor.
- A migration that does not regress currently-healthy installed clients before they accept the update.

**Non-Goals:**

- Changing HTTP verbs or paths (`GET /api/sync`, `POST /api/sync`, `POST /api/sync/compact` stay).
- Changing encryption, AAD, idempotency, sequence assignment, or compaction/baseline rules.
- Fixing the pre-existing spec drift on record encryption fields (`iv`/`encryptionVersion` vs the current `encryptionParams` envelope) — out of scope.
- Revisiting the already-landed `pullInFlightRef` and `cursor ?? 0` fixes.

## Decisions

### Decision 1: Cursor travels as `?since=<n>` query parameter

The pull cursor moves from the `If-None-Match` header to a `?since=` query parameter; the server treats a missing/empty `since` as `0`.

- **Why:** It keeps the `GET` verb (the user asked to keep naming), is the most transparent transport, and — paired with `no-store` — removes the conditional-request semantics that invite the browser cache.
- **Alternatives:** `X-Sync-Since` custom header (constant URL → cache-key collision risk without `Vary`; no real advantage over a query param). Moving pull to `POST` with a body (bulletproof against caching, but changes the verb, which we ruled out).
- **Note:** This reverses the prior `crdt-store` rule "there is no `?since=` query parameter," which existed solely to support the conditional-GET/304 design being removed.

### Decision 2: `Cache-Control: no-store` on every `/api/sync*` response

- **Why:** This is the actual root-cause neutralizer. With `no-store`, the browser and intermediaries never store or revalidate the `GET`, so the response-header-hiding/`304`-synthesis behavior cannot occur. It also makes the query-param vs header transport choice immaterial for cache-keying.
- **Alternatives:** Rely on the query param alone for cache-busting (insufficient — a repeated same-cursor `GET` is still cacheable by default). Rely on `POST` (verb change).

### Decision 3: All client-bound signaling moves into JSON response bodies, success path is always `200`

- pull → `200 { head, records }` (records `[]` when nothing newer); no `304`.
- push → `200 { assignedSeq, compactHint }` (replaces `ETag` + `X-Compact-Hint`).
- compact → `200 { assignedSeq }` (replaces `ETag`).
- **Why:** Bodies round-trip through any proxy/cache/CORS layer intact; status codes stay for `410`/`409`/`413`. The client drops `parseETag` and the `304` branch entirely — net simplification.
- **304 trade-off:** We lose the zero-body "nothing changed" response. The replacement is a ~25-byte `{ head, records: [] }`. Idle polls (focus/reconnect/5-min stale) are infrequent; the bandwidth cost is negligible and worth the robustness.

### Decision 4: Transitional server tolerance for un-refreshed old clients (the migration crux)

Because `registerType: 'prompt'` makes adoption user-gated, a hard cutover would regress **currently-healthy** installed clients: an old cached client reads `head` from `ETag`, so after the new worker stops sending `ETag` it reads `head = 0`, resets its cursor, and falls into the very loop we are fixing — until the user accepts the update toast (which they may ignore).

Decision: during a transition window the **server remains tolerant of the legacy shape** while the **new client uses only the robust path**:

- Server reads the cursor from `?since=` and, when absent, falls back to `If-None-Match` (so old clients' cursor is understood).
- Server continues to emit an informational `ETag: "<head>"` and may still return `304` **only** for conditional requests that carry `If-None-Match` (old clients), so healthy old clients keep working unchanged.
- New client sends `?since=`, never `If-None-Match`, ignores `ETag`, and reads `head` from the body — so it is unaffected by any of the above and its `GET` is unconditional + `no-store`.

The `crdt-store` spec describes the **post-transition target** (no `If-None-Match`/`ETag`/`304`). The tolerance above is a temporary implementation shim removed by a named follow-up change once update adoption is sufficient.

- **Why:** Costs a few lines, protects real users on a manual-update PWA, and keeps the new client fully robust.
- **Alternatives:** Hard cutover (rejected — regresses healthy un-refreshed clients into the loop). Switch the SW to `autoUpdate`/`skipWaiting` to shrink the window (heavier product/UX decision; can be pursued independently, see Open Questions).

## Risks / Trade-offs

- **[Old cached client loops during skew]** → Decision 4's server tolerance keeps healthy old clients working; broken old clients (those already hit by the `ETag`-stripping bug) are no worse than today and recover on update. The interim "head in body + `ETag` fallback" already deployed also helps any client that reads the body.
- **[Transitional shim lingers / never removed]** → Track an explicit follow-up change to remove `If-None-Match`/`ETag`/`304` handling; reference it in tasks so it is not forgotten.
- **[`?since=` cached despite intent]** → `no-store` on all responses prevents caching regardless of URL shape; do not rely on query-param uniqueness alone.
- **[Spec vs implementation mismatch at archive]** → The spec is the target end state; the shim is documented as temporary. Reviewers should expect the implementation to carry transitional tolerance until the follow-up lands.

## Migration Plan

1. Ship server + new client together (atomic via the Worker bundle): server reads `?since=`, sets `no-store` everywhere, returns body signaling, and retains transitional tolerance (Decision 4). New client uses the robust path only.
2. Installed PWAs show the existing update toast; users who accept it move to the new client immediately. Users who don't keep running the old client against the tolerant server with no regression.
3. After update adoption is sufficient, land the follow-up change that removes `If-None-Match`/`ETag`/`304` server handling, converging the implementation to the `crdt-store` target spec.
4. **Rollback:** revert the worker+client together; because request/response shapes change in lockstep and the server stays tolerant, rollback is low-risk.

## Open Questions

- **Transition window / trigger for the cleanup follow-up:** time-based (e.g. N weeks) or telemetry-based (share of requests still sending `If-None-Match`)? Resolve before scheduling the follow-up.
- **Adopt `autoUpdate` instead of `prompt`?** Would shrink the skew window and reduce the need for server tolerance, but changes update UX. Out of scope here; worth a separate discussion.

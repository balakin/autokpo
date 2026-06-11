## 1. Worker — pull endpoint (`worker/routes/sync.ts`)

- [ ] 1.1 Read the cursor from the `?since=` query parameter (default `0` when absent/empty); validate it is a non-negative integer, returning `400` on invalid input.
- [ ] 1.2 Remove the `304 Not Modified` branch; the success path always returns `200`.
- [ ] 1.3 Return the response body as `{ head, records }` (head = current server head; records `[]` when nothing newer than `since`).
- [ ] 1.4 Keep the `410 Gone` (stale/too-new cursor), `409 local_user_mismatch`, and `404 encryption_key_not_found` paths unchanged.
- [ ] 1.5 Set `Cache-Control: no-store` on every pull response (200/304-removed/410/409/404).
- [ ] 1.6 Transitional tolerance (per design Decision 4): when `?since` is absent, fall back to reading the cursor from `If-None-Match`; continue emitting an informational `ETag: "<head>"`. (Document inline that this is removed by the follow-up change.)

## 2. Worker — push & compact endpoints (`worker/routes/sync.ts`)

- [ ] 2.1 Push success: return `200` with JSON body `{ assignedSeq, compactHint }` instead of an empty body + `ETag` + `X-Compact-Hint`.
- [ ] 2.2 Push idempotent-replay path: return the same `{ assignedSeq, compactHint }` body shape.
- [ ] 2.3 Compact success: return `200` with JSON body `{ assignedSeq }` instead of an empty body + `ETag`.
- [ ] 2.4 Set `Cache-Control: no-store` on all push and compact responses (success and error).
- [ ] 2.5 (Optional, transitional) keep emitting `ETag`/`X-Compact-Hint` alongside the body for old clients; document as removed by the follow-up change.

## 3. Client — sync wire client (`src/crdt/sync-client.ts`)

- [ ] 3.1 Pull: build the request as `GET /api/sync?since=<cursor>`; stop sending `If-None-Match`.
- [ ] 3.2 Pull: read `{ head, records }` from the `200` JSON body; remove the `304` branch and the `parseETag` fallback. Keep the return shape `{ records, head, status }`.
- [ ] 3.3 Remove the now-unused `parseETag` helper.
- [ ] 3.4 Push: read `{ assignedSeq, compactHint }` from the response body instead of `ETag`/`X-Compact-Hint`.
- [ ] 3.5 Compact: read `{ assignedSeq }` from the response body instead of `ETag`.
- [ ] 3.6 Confirm `410`/`409`/`413` handling and error-code parsing are unchanged.

## 4. Tests

- [ ] 4.1 `worker/routes/__tests__/sync.spec.ts`: replace `ETag`/`304`/`X-Compact-Hint` assertions with body assertions (`head`, `assignedSeq`, `compactHint`); assert `?since=` is honored and that `since=head` returns `200` with empty `records`.
- [ ] 4.2 `worker/routes/__tests__/sync.spec.ts`: assert `Cache-Control: no-store` on pull, push, and compact responses.
- [ ] 4.3 `worker/routes/__tests__/sync.spec.ts`: add a test for the transitional `If-None-Match` cursor fallback (cursor honored when `?since` absent).
- [ ] 4.4 `src/crdt/__tests__/sync-client.spec.ts`: update pull tests to send `?since=` and read `head` from the body; remove `304`/`parseETag` expectations.
- [ ] 4.5 `src/crdt/__tests__/sync-client.spec.ts`: update push/compact tests to read `assignedSeq`/`compactHint` from the body.

## 5. Docs

- [ ] 5.1 `apps/app/docs/sync.md`: update the Pull-flow mermaid + rules — drop the `304` and `ETag` arms, change the request line to `GET /api/sync?since=`, and state `head` comes from the `200` body.
- [ ] 5.2 `apps/app/docs/sync.md`: update push/compact response arrows to `200 { assignedSeq, compactHint }` / `200 { assignedSeq }`; change the "`X-Compact-Hint: please`" rule to "`compactHint: true` in the push body".
- [ ] 5.3 `apps/app/docs/sync.md`: note `Cache-Control: no-store` on sync responses in the relevant rules/invariants.

## 6. Verification

- [ ] 6.1 Run worker + client sync tests: `cd apps/app && pnpm -s test src/crdt/__tests__/sync-client.spec.ts worker/routes/__tests__/sync.spec.ts --reporter=verbose`.
- [ ] 6.2 Typecheck/build: `cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 40` (expect no errors).
- [ ] 6.3 Lint changed files via `pnpm -s eslint` / `pnpm -s prettier` per repo guidance.
- [ ] 6.4 Manual: fresh client against a large history advances the cursor past `0` (no infinite IndexedDB re-writes); confirm `Cache-Control: no-store` and JSON `head` in the Network tab.

## 7. Follow-up (separate change — do not implement here)

- [ ] 7.1 Record a follow-up to remove the transitional server tolerance (`If-None-Match` fallback, informational `ETag`, conditional `304`) once update adoption is sufficient, converging the implementation to the `crdt-store` target spec.

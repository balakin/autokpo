## 1. Worker routes

- [x] 1.1 Extract `handlePull` function from `router.get('/')` body in `worker/routes/sync.ts`
- [x] 1.2 Extract `handlePush` function from `router.post('/')` body in `worker/routes/sync.ts`
- [x] 1.3 Register `router.get('/pull', handlePull)` and `router.post('/push', handlePush)` as canonical routes
- [x] 1.4 Keep `router.get('/', handlePull)` and `router.post('/', handlePush)` as deprecated aliases with `// TODO(follow-up): remove once old clients are gone` comments

## 2. Client

- [x] 2.1 Update `pull()` in `src/crdt/sync-client.ts` to fetch `${SYNC_BASE}/pull?since=...` instead of `${SYNC_BASE}?since=...`
- [x] 2.2 Update `push()` in `src/crdt/sync-client.ts` to POST to `${SYNC_BASE}/push` instead of `${SYNC_BASE}`

## 3. Docs

- [x] 3.1 Update `apps/app/docs/sync.md`: replace all `GET /api/sync` references with `GET /api/sync/pull` and all `POST /api/sync` (non-compact) references with `POST /api/sync/push`

## 4. Tests

- [x] 4.1 Update `worker/routes/__tests__/sync.spec.ts`: change test request paths from `/` (GET/POST) to `/pull` and `/push`; add smoke tests for the old alias paths returning the same responses

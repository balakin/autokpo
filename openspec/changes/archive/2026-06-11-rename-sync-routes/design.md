## Context

The sync worker router (`worker/routes/sync.ts`) is mounted at `/api/sync` via `app.route('/api/sync', syncRouter)`. Currently:

- `router.get('/')` handles pull
- `router.post('/')` handles push
- `router.post('/compact')` handles compaction

The client (`src/crdt/sync-client.ts`) uses `SYNC_BASE = '/api/sync'` and calls `fetch(SYNC_BASE, ...)` for push and `fetch(`${SYNC_BASE}?since=...`)` for pull.

There is already transitional backward-compat code in the GET handler (ETag / `If-None-Match` fallback for old clients), showing the project's pattern for graduated migration.

## Goals / Non-Goals

**Goals:**

- Canonical routes become `GET /api/sync/pull` and `POST /api/sync/push`
- Old routes remain as deprecated aliases so old clients continue working
- No behavior changes — same request/response shapes on all paths
- `docs/sync.md` reflects the new canonical paths

**Non-Goals:**

- Removing old aliases (deferred, tagged with TODO)
- Removing ETag / `If-None-Match` transitional code (separate concern, existing TODOs)
- Changing the compact route
- Any protocol or schema change

## Decisions

### Extract handlers into named functions

Rather than duplicating the handler body or using internal redirects, extract `handlePull` and `handlePush` as standalone async functions that accept a Hono context. Both the new and old route registrations call the same function.

```
router.get('/pull', handlePull)
router.get('/', handlePull)   // TODO(follow-up): remove once old clients are gone

router.post('/push', handlePush)
router.post('/', handlePush)  // TODO(follow-up): remove once old clients are gone
```

This avoids drift and keeps the route registration declarative.

**Alternative considered**: HTTP 308 redirect from old to new path. Rejected — redirects add a round-trip, may not preserve request body for POST, and complicate CORS/cookie handling in the Cloudflare Worker environment.

## Risks / Trade-offs

- [Low risk] Old aliases must not be removed until all deployed clients have updated. The TODO comment pattern already used in this codebase is sufficient tracking.
- [No risk] No data model, protocol, or auth changes — purely additive routing.

## Migration Plan

1. Deploy worker with both new canonical routes and old aliases active simultaneously.
2. Deploy updated client that calls `/pull` and `/push`.
3. Old aliases remain until a future cleanup PR removes them.

No rollback complexity — old routes are untouched, so reverting the client update is sufficient if needed.

## Why

The current sync API uses generic HTTP verbs on a single `/api/sync` path (`GET` for pull, `POST` for push), making the intent ambiguous in logs, rate-limit rules, and documentation. Explicit sub-paths (`/api/sync/pull`, `/api/sync/push`) make each operation self-describing and align with the already-named `/api/sync/compact`.

## What Changes

- `GET /api/sync` becomes `GET /api/sync/pull` (canonical)
- `POST /api/sync` becomes `POST /api/sync/push` (canonical)
- Old routes (`GET /api/sync`, `POST /api/sync`) are kept as deprecated backward-compat aliases with TODO comments for future removal
- `POST /api/sync/compact` is unchanged
- Client (`src/crdt/sync-client.ts`) updated to call the new canonical paths
- `docs/sync.md` updated to reference the new canonical paths

## Capabilities

### New Capabilities

None — this is a rename/alias change with no new behavior.

### Modified Capabilities

- `sync-encryption`: route paths referenced in the sync protocol spec change from `/api/sync` (GET/POST) to `/api/sync/pull` and `/api/sync/push`

## Impact

- `worker/routes/sync.ts`: add `/pull` and `/push` handlers; keep `/` and `/` as aliases
- `src/crdt/sync-client.ts`: update fetch URLs for pull and push
- `apps/app/docs/sync.md`: update all references to `GET /api/sync` → `GET /api/sync/pull` and `POST /api/sync` → `POST /api/sync/push`
- No schema or protocol changes; no migration needed

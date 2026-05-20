## Context

Sessions are managed by `better-auth` with an HttpOnly cookie. The default `expiresIn` is 7 days with a 1-day `updateAge` (sliding window). `SignedOutCleaner` runs every 30 seconds on the leader tab when no session exists — it deletes IndexedDB databases matching `autokpo-yjs:*` and localStorage entries under `autokpo:sync:*`.

The 7-day window is too short for this app's usage patterns. A secondary device (tablet, home computer) that wasn't opened for 8 days loses its session silently, triggering a data wipe that destroys any unsynced offline changes.

## Goals / Non-Goals

**Goals:**

- Extend session sliding window to 60 days so normal usage gaps don't cause session loss
- Remove `SignedOutCleaner` to stop the automatic local data wipe on session loss

**Non-Goals:**

- Global 401 interceptor for non-sync API calls (separate concern, lower priority)
- Encrypting local data (planned separately as E2E encryption)
- Changing how explicit logout or session revocation works

## Decisions

### Session values: `expiresIn: 60 days`, `updateAge: 7 days`

`expiresIn` sets the absolute session lifetime; `updateAge` controls how frequently the expiry is extended on activity. Any visit within 60 days resets the clock. The 7-day `updateAge` means the session is extended at most once per week, reducing unnecessary DB writes.

Alternatives considered:

- `updateAge: 1 day` (better-auth default) — extends on every daily visit, more DB writes, no real benefit
- `updateAge: 60 days` — only extends once total; a user who visits on day 59 would expire on day 60+60 but wouldn't trigger extension until day 60 of the new window. Too coarse.
- 90-day window — covers quarterly gaps but this app is used at minimum monthly; 60 days matches Proton's approach and is sufficient.

### Remove SignedOutCleaner entirely

The cleaner's purpose was to wipe plaintext local data when a session is gone. With a 60-day window this scenario becomes rare; with E2E encryption planned it becomes moot (encrypted blobs need no wipe). Removing it now avoids the data loss risk without adding complexity.

The sync metadata key `autokpo:sync:${userId}` and IndexedDB database `autokpo-yjs:${userId}` will persist across sessions. On re-authentication, the sync engine picks up from the stored cursor and pushes any dirty local changes — no data loss.

Alternatives considered:

- Dirty-aware cleaner (skip wipe if `dirty: true`) — adds complexity, still doesn't help if the user re-authenticates later and the cursor is stale. Simpler to just not wipe.
- Keep cleaner, increase window — still wipes on expiry; fails users who are idle longer than the window.

## Risks / Trade-offs

- **Orphaned localStorage entries**: `autokpo:sync:${userId}` keys accumulate for users who sign in on a device and never return. Impact is negligible — each entry is a small JSON blob. No mitigation needed until E2E encryption is in place and a proper key-lifecycle strategy is defined.

- **Stale IndexedDB on shared devices**: A device shared between multiple users retains each user's Yjs database. With E2E encryption this is safe; without it, a subsequent user with device access could read prior user's data. Accepted as a known limitation until E2E lands.

- **Longer session exposure window**: A stolen session cookie is valid for up to 60 days instead of 7. Mitigated by existing session revocation in Account Settings — users can revoke individual sessions remotely.

## Migration Plan

No database migration needed — `better-auth` stores `expiresAt` per session row; existing sessions keep their current expiry and will be refreshed on next use under the new `updateAge` window.

Deployment is a normal worker deploy — no rollout steps required.

Rollback: revert `auth-options.ts` changes and redeploy. Existing long sessions remain in the DB but will expire naturally or can be bulk-revoked via the DB if needed.

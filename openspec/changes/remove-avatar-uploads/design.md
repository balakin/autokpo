## Context

AutoKPO is a personal/hobby project running on Cloudflare's free tier. Profile images (avatars) are the only feature using R2. Cloudflare's free tier for R2 has no hard spending cap — exceeding the 10 GB storage / 1M operations quota incurs billed overage. There's no way to set a Cloudflare-side spending limit on R2. This creates unbounded financial risk for a project without revenue.

The avatar feature is fully optional and non-essential. Removing it eliminates the R2 billing vector entirely. Code is preserved in git history; re-enablement when moving to a paid plan requires only restoring deleted files and adding the R2 binding back.

## Goals / Non-Goals

**Goals:**

- Eliminate all R2 usage and spending risk
- Remove avatar upload, OAuth import, storage, and serving code paths
- Remove `imageStatus`, `pendingAvatarUrl` from Better Auth config and DB schema
- Keep avatar display (initials fallback) working in all UIs
- Show a disabled-state tooltip on the settings page avatar explaining unavailability
- Preserve code in git history for future re-enablement

**Non-Goals:**

- Feature-flag gating (overengineered for a single-feature removal)
- Alternative avatar storage (D1, KV, etc.)
- Removing `user.image` column (Better Auth built-in, kept as dead column)
- Changing UserAvatar component behavior (already handles null → initials)

## Decisions

### Delete avatar code rather than guard it

**Chosen:** Delete the files (`worker/routes/avatars.ts`, `worker/avatar-storage.ts`) and remove avatar code from touched files.

**Alternative considered:** Keep files with `if (!env.AVATARS)` guard clauses everywhere. Rejected because:

- It's feature-flag complexity for a feature that won't be re-enabled for the foreseeable future
- The deleted code lives in git history — trivial to restore
- Guarded dead code invites bit-rot (tests get stale, types drift)
- Cleaner to remove and later revert the commit than maintain dormant code

### Migration approach: `db:generate` from schema change

**Chosen:** Remove `imageStatus` and `pendingAvatarUrl` columns from `worker/db/schema/auth.ts`, then run `pnpm db:generate` to produce a D1 migration. Keep `user.image` (Better Auth built-in).

**Alternative considered:** Manually write a migration to drop columns. Rejected because Drizzle Kit auto-generates correct migrations from schema diff.

### Settings page tooltip: on avatar hover, not a separate badge

**Chosen:** Wrap the avatar in a Tooltip component that shows "Changing avatar is not available right now" on hover. The avatar still shows initials (no image).

**Alternative considered:** Separate info card or badge. Rejected — a tooltip is subtler and directly associated with the avatar element the user would interact with.

### Client-side: remove avatar fields from session and API

**Chosen:** Strip `image`/`imageStatus` from `StoredSession`, `AccountProfile`, and `AuthContext`. The `UserAvatar` component uses `image` prop directly — it'll just always receive `null`.

## Risks / Trade-offs

- **[Risk] Re-enablement effort** → Code lives in git history. Reverting the removal commit and re-adding the R2 binding to wrangler.jsonc is the restoration path. Migration to re-add columns would also be needed.
- **[Risk] Stale `user.image` column** → Better Auth's built-in `image` column remains in the schema but will always be `null`. No operational impact. Zero-cost to leave.
- **[Risk] Tests need cleanup** → ~5 test files have avatar-related test cases. They'll be removed/scoped down along with the code.
- **[Risk] OAuth sign-up flow changes** → The `user.create` before/after hooks that handled pending avatar import are removed. OAuth sign-up still works — the provider's `image` URL is simply discarded instead of being imported.

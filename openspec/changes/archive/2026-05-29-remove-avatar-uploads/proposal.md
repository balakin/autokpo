## Why

Cloudflare R2 free tier has no hard spending cap, creating unbounded billing risk for a personal project that only uses R2 for optional profile images. Removing avatar upload functionality eliminates this risk entirely while keeping the codebase for future re-enablement.

## What Changes

- **BREAKING**: Remove avatar upload, import, storage, and serving — all `PUT`/`DELETE`/`GET /avatars/*` routes, R2 integration, and OAuth provider avatar import
- Remove `imageStatus`, `pendingAvatarUrl` from Better Auth `additionalFields` config and from DB schema (via migration)
- Remove avatar upload/remove API client functions and UI (picker, crop modal, remove button)
- **BREAKING**: Remove `r2_buckets` binding from `wrangler.jsonc`
- Keep `UserAvatar` component — it already falls back to colored initials when `image` is null
- Add disabled-state tooltip on avatar hover in account settings: "Changing avatar is not available right now"

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `profile-images`: Remove all avatar upload, serving, OAuth import, and import-status polling requirements. Avatar display (initials fallback) remains as-is.
- `account-settings`: Remove avatar change, crop, upload, and remove scenarios. Replace with disabled-avatar tooltip behavior.

## Impact

- Affected code: `worker/routes/avatars.ts`, `worker/avatar-storage.ts`, `worker/auth.ts`, `worker/auth-options.ts`, `worker/main.ts`, `wrangler.jsonc`, `worker-configuration.d.ts` (regenerated), `worker/db/schema/auth.ts` (migration via `db:generate`)
- Affected client: `src/settings/account-settings-api.ts`, `src/settings/account-settings-page.tsx`, `src/auth/auth-session.ts`, `src/auth/auth-provider.tsx`, `src/auth/auth-context.ts`, `src/auth/auth-client.ts`
- R2 buckets `autokpo-avatars-dev` / `autokpo-avatars-production` no longer needed
- No runtime dependencies change

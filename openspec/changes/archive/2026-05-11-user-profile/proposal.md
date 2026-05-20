## Why

Users have no way to see which account they are signed in as, and the only sign-out action is buried in the Settings page under a "Data" card. The app provides no account identity at a glance.

## What Changes

- Add a profile avatar button fixed to the top-right of the top bar (always rightmost, never displaced by portal actions).
- Clicking the avatar opens a profile panel showing: identity (avatar + email), online/offline status, sync status (dirty flag), and a sign-out button.
- Presentation is responsive: desktop uses a popover, mobile uses a full-screen drawer.
- Avatar display: use the OAuth profile image when available; fall back to an initials circle derived from the email address, with color derived from the user ID hash.
- Consolidate auth session localStorage from the single `autokpo:remembered-local-user` key into a single `autokpo:session` JSON key that carries `{ userId, email, image }`. This enables offline display of identity without additional keys.
- Sign-out logic:
  - Offline → button disabled, inline warning explaining the user must be online to sign out and can clear browser site data as an escape hatch.
  - Online + unsynced changes (`dirty = true`) → confirmation modal before signing out.
  - Online + no unsynced changes → immediate sign-out.
- Remove the sign-out action from the Settings page Data section.

## Capabilities

### New Capabilities

- `user-profile`: Profile avatar button in the top bar, popover panel with identity/status/sign-out, avatar fallback logic, and offline-aware sign-out flow.

### Modified Capabilities

- `user-auth`: Session storage key changes from `autokpo:remembered-local-user` (string) to `autokpo:session` (JSON object with `userId`, `email`, `image`). All reads and writes of the remembered user id must be updated to use the new key and shape.
- `settings`: Sign-out action is removed from the Settings page Data section.
- `app-shell`: Top bar gains a persistent profile avatar button as its rightmost element.

## Impact

- `src/auth/auth-session.ts` — replace `readStoredUserId` / `writeStoredUserId` with a unified session store read/write; update `refreshSession` to persist email and image.
- `src/auth/auth-context.ts` / `auth-provider.tsx` — expose a `user` object (`id`, `email`, `image`) from context so the profile UI can read cached values.
- `src/auth/signed-out-cleaner.tsx` — update key cleanup to target `autokpo:session` instead of `autokpo:remembered-local-user`.
- `src/app-shell/top-bar.tsx` — add profile avatar button.
- `src/app-shell/sidebar.tsx` — no change (version chip stays).
- `src/settings/settings-page.tsx` — remove sign-out button from Data card.
- New files: `src/auth/user-profile-button.tsx`, `src/auth/profile-popover.tsx`, `src/auth/user-avatar.tsx`, `src/auth/user-avatar-color.ts`, `src/hooks/use-online.ts`, `src/hooks/use-is-mobile.ts`.
- No new dependencies required; online/offline detection via `navigator.onLine` + window events.

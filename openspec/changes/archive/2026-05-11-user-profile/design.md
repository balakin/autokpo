## Context

The app currently stores only `userId` in `localStorage` under `autokpo:remembered-local-user` and exposes only `userId` through `AuthContext`. No other account data is cached. The sign-out action lives in the Settings page Data card, which is inconvenient and disconnected from account identity.

`better-auth` returns a full user object (`id`, `email`, `name`, `image`) on `getSession()`. For OAuth (Google, GitHub) users, `image` is the provider profile picture URL. For email OTP users, `image` is `null`.

## Goals / Non-Goals

**Goals:**

- Show the active account identity at a glance from any page.
- Surface online/offline status and sync state before signing out.
- Make sign-out safe: block it offline, confirm it when unsynced changes exist.
- Cache identity data offline so the UI degrades gracefully without a network.

**Non-Goals:**

- Avatar upload or custom profile pictures.
- Name/surname collection.
- A dedicated `/profile` or `/account` route.
- Editing any user data.

## Decisions

### 1. Profile button lives in the top bar, outside the portal target

The `TopBarActionsSlot` portal is used by individual pages for contextual actions ("Nova knjiga", "Download PDF"). The profile button is a persistent shell element. Placing it directly in `TopBar` JSX (to the right of the `portalRef` div) ensures it is always rightmost and never displaced or mixed with page actions.

**Alternative considered**: Sidebar bottom. Rejected because the top bar is always visible on both desktop and mobile without opening a drawer, and it is the conventional placement for account identity in web apps.

### 2. `autokpo:session` replaces `autokpo:remembered-local-user`

A single JSON key `autokpo:session` with shape `{ userId: string, email: string, image: string | null }` replaces the bare string key. This keeps all auth-related identity data in one place, is easier to clear on logout, and avoids key proliferation.

**Migration**: On `readStoredSession()`, if `autokpo:session` is absent but `autokpo:remembered-local-user` is present, migrate atomically: write `{ userId, email: null, image: null }` to the new key and remove the old one. This is a one-time silent upgrade with no data loss.

**SignedOutCleaner** must be updated to clear `autokpo:session` instead of `autokpo:remembered-local-user`.

### 3. AuthContext exposes a normalized user object

`AuthContext` exposes `user: { id: string, email: string | null, image: string | null } | null` instead of separate top-level fields. The value is read from `autokpo:session` on mount (synchronous, offline-safe) and updated after `refreshSession()` resolves (picks up fresh values from the server). Components read identity via `useAuth()` with no additional fetching.

### 4. Avatar: provider image with initials fallback

- If `image` is set → render `<img>` with the URL.
- If `image` is null → render an initials circle: first character of the email address, uppercased. Background color is derived by hashing `userId` into one of N fixed palette colors (deterministic, same color every session).

No external avatar service. No random color on each render.

### 5. Responsive profile panel: Popover on desktop, Drawer on mobile

Desktop uses a HeroUI `Popover` anchored to the avatar button (`w-72`) with internal spacing so the sign-out button is visually separated from the identity section. Mobile uses a full-screen right `Drawer` for touch-friendly interaction.

Both variants are dismissed by their standard close interactions (outside click / Escape where applicable, explicit close control), and desktop popover state is explicitly closed before opening the dirty-sign-out confirmation modal.

### 6. Online/offline detection via a `useOnline` hook

```
useOnline() → boolean
```

Reads `navigator.onLine` and subscribes to `window` `online`/`offline` events. Note: `navigator.onLine` can falsely report `true` when the network is technically unreachable. If sign-out fails despite appearing online, a toast error is shown. This is acceptable — the user can retry.

### 7. Sign-out flow

```
click sign out
  └─ offline?  → show inline warning (button disabled), no action
  └─ online?
       └─ dirty?  → open confirmation modal → on confirm → auth.logout()
       └─ clean?  → auth.logout() directly
```

`dirty` is read from `useSyncMetadata(s => s.dirty)`. Online/offline from `useOnline()`. Mobile/desktop branching uses `useIsMobile()`.

### 8. Remove sign-out from Settings

The Settings page Data card currently includes a sign-out button alongside sync/export/import actions. It will be removed. The only sign-out path is the profile popover.

## Risks / Trade-offs

- **OAuth image URL expiry**: Some providers issue time-limited image URLs. A cached URL may stop loading after a period. → Mitigation: re-fetching happens naturally on every `refreshSession()` call (app start, tab focus). Stale image falls back to initials gracefully via `onError`.
- **`navigator.onLine` false positive**: User appears online but network is unavailable; sign-out attempt fails. → Mitigation: catch the error, show a toast, leave the user signed in. The offline warning text also hints at clearing browser data as an emergency escape.
- **Key migration race**: Two tabs simultaneously reading the old key and writing the new one. → Mitigation: migration is idempotent (write new key, remove old key); both tabs end up with the same result.

## Migration Plan

1. Update `auth-session.ts`: introduce `readStoredSession` / `writeStoredSession` with migration logic.
2. Update `AuthProvider` to read and expose `user` (`id`, `email`, `image`).
3. Update `SignedOutCleaner` to clear `autokpo:session`.
4. Add profile button to `TopBar`.
5. Remove sign-out from `SettingsPage`.
6. No server-side changes required.
7. No data loss on deploy — migration runs silently on first app load per tab.

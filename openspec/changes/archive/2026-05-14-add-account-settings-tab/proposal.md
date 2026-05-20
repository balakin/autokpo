## Why

Account/profile settings need a clear home without creating a second top-level settings concept. The existing Settings page should become a shared settings area with route-backed tabs so app settings and account settings are easy to discover, deep-link, and reason about.

## What Changes

- Convert Settings into a layout route with tabs and nested child routes.
- Move the current Theme, Language, Data, and sync-status content into a General settings tab at `/settings/general`.
- Add an Account settings tab at `/settings/account` for signed-in account/profile settings.
- Redirect `/settings` to `/settings/general` as the canonical default settings view.
- Link the sidebar Settings item to the General tab and the profile popover account-settings action to the Account tab.
- Make account settings online-only: while offline, do not fetch account settings and show an unavailable-without-internet message.
- Show account identity, online/sync status, loading and load-error states in the Account tab; avatar change and account deletion are visible but unavailable placeholders.
- Keep sign-out in the profile panel guarded by online/sync state: sign-out is disabled offline and warns before signing out with unsynchronized local changes.

## Capabilities

### New Capabilities

- `account-settings`: Account/profile settings surface inside Settings, including online-only availability behavior.

### Modified Capabilities

- `settings`: Settings becomes a route-backed tabbed layout with General and Account child tabs.
- `user-profile`: Profile popover gains an account-settings navigation action.
- `app-shell`: Sidebar and breadcrumbs account for route-backed settings tabs.

## Impact

- Affected app code: `src/router.tsx`, `src/settings/`, `src/auth/profile-popover.tsx`, `src/app-shell/sidebar.tsx`, `src/app-shell/top-bar.tsx`.
- Affected tests: settings page tests, profile popover tests, app shell/sidebar/breadcrumb tests.
- Uses existing `useOnline()` for browser online/offline state and React Query `enabled` gating for account data fetching.
- Uses Better Auth session/account APIs for fresh account identity; email changes, avatar upload, and account deletion execution are out of scope for this change.

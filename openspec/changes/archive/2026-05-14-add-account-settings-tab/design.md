## Context

The app currently has a single Settings page at `/settings` containing app-level configuration: theme, language, data actions, and sync status. The top bar profile popover contains identity/status/sign-out controls, but there is no dedicated account/profile settings surface.

Adding account settings as a separate top-level page would create two competing settings concepts. The desired model is one Settings area with route-backed tabs: General for existing app settings and Account for online-only signed-in account/profile settings.

The app is local-first and can run offline. Account settings are server-backed through Better Auth, so the Account tab must explicitly require internet access and must not trigger profile queries while offline.

## Goals / Non-Goals

**Goals:**

- Represent Settings as a layout route with tabs and a nested `<Outlet />`.
- Move existing settings content into `/settings/general` without changing its behavior.
- Add `/settings/account` as the account/profile settings tab.
- Provide a profile popover action that deep-links to `/settings/account`.
- Gate account settings fetching with `useOnline()` and React Query `enabled` so no account profile request runs while offline.
- Show a clear offline-unavailable state for account settings.
- Show account loading and load-error states so online account failures do not look like empty settings.
- Keep destructive/session actions safe by disabling sign-out offline and confirming sign-out when local sync has pending changes.

**Non-Goals:**

- Email change flow. Better Auth handles email changes separately from `updateUser`, and configuring/UX-designing that flow is outside this change.
- Account deletion execution, connected account management, avatar upload storage, or broader auth administration.
- Changing the existing local-first app data model or CRDT sync behavior.

## Decisions

### Use route-backed settings tabs

Settings tabs SHALL be represented by nested routes:

```text
/settings
  -> redirect /settings/general
/settings/general
  -> existing app settings
/settings/account
  -> account settings
```

Rationale: route-backed tabs give the profile popover a stable destination, preserve refresh/back/deep-link behavior, and avoid query-param parsing. A state-only tab would be simpler locally but worse for direct navigation from the popover.

### Keep one sidebar Settings item

The sidebar SHALL keep one Settings navigation item and link it to `/settings/general`.

Rationale: users should not see separate App Settings and Profile Settings destinations. Settings remains one navigation concept; tabs divide the content inside it.

### Use Account/Nalog naming for user settings

The account tab label SHALL use the account concept rather than the generic profile concept.

Rationale: this app already has taxpayer/entity profile concepts. “Account”/“Nalog” better describes authenticated-user settings and reduces confusion with entity profiles used for KPO books.

### Gate account queries with online state

The Account tab SHALL call `useOnline()` and configure its React Query profile/account query with `enabled: isOnline` (and signed-in-user presence where applicable). When offline, the page SHALL render the offline-unavailable state instead of query loading/error/success UI.

Rationale: account settings are server-backed and are explicitly unavailable without internet. Avoiding a disabled query prevents unnecessary network attempts and avoids misleading stale editable account data.

### Scope account editing to Better Auth-supported profile fields

The first Account tab implementation SHOULD display fresh server-backed identity from the auth session and avoid exposing unsupported profile-edit fields as editable form controls. Email is read-only unless a separate email-change flow is designed later. Avatar change and account deletion MAY be shown as visible placeholders that explain the action is not available yet.

Rationale: Better Auth rejects `email` in `updateUser`; email changes use a separate `changeEmail` flow and require additional configuration and verification UX.

### Use explicit profile-panel sign-out safeguards

The profile panel SHALL keep the sign-out action online-only. If local sync metadata reports unsynchronized changes, sign-out SHALL require confirmation before calling the auth logout flow.

Rationale: logging out requires server/auth availability, and confirming when local changes are dirty reduces accidental data-loss risk in the local-first model.

## Risks / Trade-offs

- Route-backed tabs add small router/test complexity → Keep SettingsLayout thin and put tab-specific behavior in child components.
- Redirecting `/settings` changes the canonical URL → Preserve user expectations by redirecting to `/settings/general` and keeping sidebar label unchanged.
- Account tab could display stale cached session data as editable while offline → Render a dedicated offline unavailable state before running account queries.
- Account profile fetch can fail while the browser is technically online → Render an inline error state that asks the user to check the connection and retry later.
- Placeholder account actions could imply completed support → Use unavailable toasts for avatar change and account deletion until those flows are designed.

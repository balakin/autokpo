## 1. Settings route layout

- [x] 1.1 Split the current `SettingsPage` app-settings content into a General settings child component/page.
- [x] 1.2 Create a Settings layout component that renders the hidden settings heading, route-backed tabs, and an `<Outlet />`.
- [x] 1.3 Update the router so `/settings` redirects to `/settings/general`, and `/settings/general` plus `/settings/account` render inside the Settings layout.
- [x] 1.4 Update the sidebar Settings navigation target to `/settings/general` while keeping it active for all `/settings/*` routes.
- [x] 1.5 Update settings breadcrumbs/top-bar route matching so settings child routes display the Settings breadcrumb.

## 2. Account settings tab

- [x] 2.1 Add an Account settings child page at `/settings/account` with an online/offline branch using `useOnline()`.
- [x] 2.2 Add a React Query account/profile query that is enabled only when the browser is online and a signed-in user is present.
- [x] 2.3 Render an offline unavailable message when the browser is offline, without running the account/profile query.
- [x] 2.4 Render loaded account identity/profile information when online, keeping email read-only and limiting editable fields to Better Auth-supported profile fields.
- [x] 2.5 Render account loading and query-error states for the online account/profile query.
- [x] 2.6 Keep avatar change and account deletion as unavailable placeholders with explanatory feedback.

## 3. Profile popover integration

- [x] 3.1 Add an account settings action to the desktop profile popover that navigates to `/settings/account`.
- [x] 3.2 Add the same account settings action to the mobile profile drawer.
- [x] 3.3 Keep the account settings action available while offline so the Account tab can explain the offline limitation.
- [x] 3.4 Disable sign-out while offline and show an offline sign-out warning.
- [x] 3.5 Confirm sign-out before logging out when local sync metadata reports unsynchronized changes.

## 4. Tests and localization

- [x] 4.1 Update settings tests for the new Settings layout, General tab route, Account tab route, and `/settings` redirect behavior.
- [x] 4.2 Add Account tab tests covering online query behavior and offline no-query/unavailable-message behavior.
- [x] 4.3 Update profile popover tests to cover the account settings navigation action.
- [x] 4.4 Update app shell/sidebar/breadcrumb tests for `/settings/general` and `/settings/account`.
- [x] 4.5 Run Lingui extraction and fill new translations for all supported locales.

## 5. Verification

- [x] 5.1 Run the relevant Vitest suites for settings, profile popover, and app shell.
- [x] 5.2 Run app build/typecheck and address any errors.
- [x] 5.3 Run OpenSpec status/validation for `add-account-settings-tab` and resolve any artifact issues.

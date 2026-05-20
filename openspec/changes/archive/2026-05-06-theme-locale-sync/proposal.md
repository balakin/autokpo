## Why

Theme and locale providers are mounted inside `SignedInApp` — below the auth gate — so the login screen has no active theme and no language preference. Locale defaults are hardcoded to `sr-Latn` in `bootstrap()` rather than using the device's actual language, and neither setting syncs across open tabs.

## What Changes

- `LocaleProvider` and `ThemeProvider` move above the router so both are available on the auth page
- `ThemeProvider` gains a `storage` event listener for cross-tab sync (device-scoped, no CRDT)
- `LocaleProvider` reads from `localStorage`, falling back to `navigator.language` then `sr-Latn`; no CRDT dependency
- New `CrdtLocaleProvider` mounts inside `CrdtProvider` and replaces `setLocale` in context with a CRDT-writing version
- New `LocaleSynchronizer` component (inside `CrdtLocaleProvider`, sibling of its context override) syncs remote CRDT locale updates → outer `setLocale` → `localStorage`
- `bootstrap()` receives `initialLocale` from `localStorage` instead of hardcoding `sr-Latn`, so new accounts inherit the device language
- Auth page gains draft theme and locale selectors

## Capabilities

### New Capabilities

- `crdt-locale-sync`: `CrdtLocaleProvider` and `LocaleSynchronizer` — CRDT-to-localStorage locale sync for signed-in users

### Modified Capabilities

- `theme-preference`: add cross-tab sync via `storage` event; provider available pre-auth
- `i18n`: locale reads `navigator.language` as fallback; provider available pre-auth; cross-device sync via CRDT post-auth
- `crdt-store`: `bootstrap()` accepts `initialLocale` parameter; seeds `user.locale` from localStorage instead of hardcoding `sr-Latn`
- `settings`: theme and locale selectors also available on the auth page (draft)

## Impact

- `src/settings/theme-provider.tsx` — add `storage` event listener; move mount point above router
- `src/i18n/locale-provider.tsx` — rewrite to read localStorage + `navigator.language`; remove CRDT dependency; add `storage` event listener; move mount point above router
- `src/crdt/locale-synchronizer.tsx` — new: `LocaleSynchronizer` component
- `src/crdt/crdt-locale-provider.tsx` — new: `CrdtLocaleProvider` component
- `src/crdt/crdt-provider.tsx` — mount `CrdtLocaleProvider` inside provider tree
- `src/crdt/doc.ts` — `bootstrap()` accepts `initialLocale: string`
- `src/auth/auth-entry.tsx` — add draft theme + locale selectors
- `src/signed-in-app.tsx` — remove `LocaleProvider` and `ThemeProvider`
- `src/main.tsx` (or root entry) — wrap router with `LocaleProvider` + `ThemeProvider`

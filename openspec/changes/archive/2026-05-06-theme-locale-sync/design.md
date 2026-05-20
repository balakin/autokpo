## Context

`ThemeProvider` and `LocaleProvider` are both mounted inside `SignedInApp`, which only renders after authentication. The login screen (`AuthEntry`) therefore has no active theme and no locale. Locale defaults in `bootstrap()` are hardcoded to `sr-Latn` rather than using the device's language. Neither preference syncs across open browser tabs.

The app targets users on both mobile and desktop simultaneously, making cross-device locale sync a core requirement. Theme, by contrast, is intentionally device-scoped (a user may prefer dark on desktop and light on mobile).

## Goals / Non-Goals

**Goals:**

- Theme and locale selectors available on the auth/login page
- Cross-tab theme and locale sync within a single device
- Cross-device locale sync via CRDT for signed-in users
- New accounts seed locale from the device language rather than hardcoded `sr-Latn`
- No new React context APIs or custom hooks beyond what already exists

**Non-Goals:**

- Cross-device theme sync (theme remains device-scoped by design)
- Server-side or HTTP-header locale detection
- Flash-of-wrong-theme prevention (addressed by existing inline script in `index.html`)

## Decisions

### Decision: LocaleProvider reads localStorage; CrdtLocaleProvider handles CRDT

Two providers form a layered stack rather than one provider that conditionally uses CRDT.

`LocaleProvider` (above router): reads `localStorage`, falls back to `navigator.language`, then `sr-Latn`. Exposes `{ locale, setLocale }` where `setLocale` writes localStorage and activates i18n. Works with zero CRDT knowledge.

`CrdtLocaleProvider` (inside `CrdtProvider`): reads `locale` from the outer `LocaleContext` unchanged. Replaces only `setLocale` with a version that writes to the CRDT doc. `LocaleSynchronizer` (sibling to the context override, so it reads the outer `setLocale`) syncs remote CRDT updates back to localStorage via the outer setter.

**Alternative considered**: a single provider that conditionally uses CRDT when available. Rejected because it requires detecting auth state from within the locale module, creating a cross-cutting dependency.

### Decision: LocaleSynchronizer as sibling to context override, not a child

```tsx
function CrdtLocaleProvider({ children }) {
  const { locale, setLocale } = useLocale(); // outer — localStorage setter

  return (
    <>
      <LocaleSynchronizer />{' '}
      {/* reads outer context → localStorage setLocale */}
      <LocaleContext value={{ locale, setLocale: setCrdtLocale }}>
        {children} {/* reads inner context → CRDT setLocale */}
      </LocaleContext>
    </>
  );
}
```

Placing `LocaleSynchronizer` before the context override means `useLocale()` inside it resolves to the outer (localStorage) setter without prop drilling. Position in the tree is the mechanism — no extra APIs needed.

**Alternative considered**: pass `setLocale` as a prop to `LocaleSynchronizer`. Rejected: prop drilling leaks internal wiring unnecessarily.

### Decision: `storage` event for cross-tab sync

Both providers add a `window.addEventListener('storage', handler)` listener. When one tab writes to localStorage, all other tabs receive the event and update their state. The writing tab already has the correct state so it correctly does not receive its own event.

Multiple signed-in tabs will also write localStorage redundantly (each tab's `LocaleSynchronizer` fires on CRDT updates). This is idempotent — all tabs write the same value — and requires no coordination.

**Alternative considered**: BroadcastChannel for tab sync. Rejected: `storage` event is a browser primitive that requires no new infrastructure and works for both pre-auth and post-auth cases.

### Decision: `bootstrap()` receives `initialLocale` parameter

`CrdtProvider` reads `localStorage` for the current locale before the doc is ready and passes it to `bootstrap()`. If `user.locale` is absent in the doc, `bootstrap()` seeds it with `initialLocale` instead of `'sr-Latn'`. Existing accounts (doc already has `user.locale`) are unaffected.

**Alternative considered**: read localStorage inside `bootstrap()`. Rejected: `bootstrap()` is a pure doc-mutation function; reading `localStorage` inside it would be a side-channel dependency that complicates testing.

### Decision: Theme stays localStorage-only, no CRDT

Theme is intentionally device-scoped. A user may want dark mode on their desktop and light on their phone. Adding theme to CRDT would override this. Cross-tab sync via `storage` event is sufficient.

## Risks / Trade-offs

- **One-tick async gap for locale after CRDT write** — `setCrdtLocale` writes to the doc; `LocaleSynchronizer`'s `useEffect` propagates it to localStorage on the next tick. Signed-in UI reads from the outer context (localStorage), so locale visually lags by one render cycle after a user-initiated change. Mitigation: acceptable given locale changes are infrequent and the gap is sub-frame in practice. If it becomes noticeable, `setCrdtLocale` can call the outer `setLocale` optimistically before the CRDT write.

- **navigator.language may not match a supported locale** — The fallback chain is `localStorage → navigator.language → sr-Latn`. If `navigator.language` is `'fr'` (unsupported), it falls through to `sr-Latn`. Mitigation: the fallback is explicit and logged; users can change locale on the auth page.

- **bootstrap seeding happens before remote sync completes** — On a new device for an existing account, `bootstrap()` may seed the doc with the device locale before the server's value syncs in. The sync engine will overwrite with the account's locale, which `LocaleSynchronizer` then propagates to localStorage. Net result: one locale flash on first sign-in on a new device. Mitigation: acceptable UX trade-off; the correct locale settles within seconds.

## Migration Plan

1. Deploy `LocaleProvider` and `ThemeProvider` above router — no user-visible change for signed-in users (providers still present, just mounted higher)
2. Remove providers from `SignedInApp`
3. Add `CrdtLocaleProvider` inside `CrdtProvider` — existing locale CRDT field continues to work
4. Update `bootstrap()` signature — backward-compatible; callers that pass `initialLocale` get improved seeding
5. No database migration required
6. Rollback: revert provider mount points; `bootstrap()` change is safe to revert (existing docs are unaffected)

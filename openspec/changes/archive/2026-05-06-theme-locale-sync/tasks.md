## 1. Rewrite LocaleProvider (localStorage + storage event, no CRDT)

- [x] 1.1 Rewrite `src/i18n/locale-provider.tsx` to read locale from `localStorage` (`autokpo:locale`), falling back to `navigator.language` best-match then `sr-Latn`; expose `setLocale` that writes `localStorage` and calls `i18n.activate`; remove all CRDT dependencies
- [x] 1.2 Add `storage` event listener in `LocaleProvider` that updates state and calls `i18n.activate` when `autokpo:locale` changes in another tab
- [x] 1.3 Update `src/i18n/__tests__/locale-provider.spec.tsx` to test localStorage read, `navigator.language` fallback, and storage event cross-tab sync

## 2. Add storage event cross-tab sync to ThemeProvider

- [x] 2.1 Add `storage` event listener in `src/settings/theme-provider.tsx` that calls `setTheme` (updating state and DOM) when `autokpo:theme` changes in another tab
- [x] 2.2 Update `src/settings/__tests__/theme-provider.spec.tsx` to cover the storage event sync scenario

## 3. Move providers above the router

- [x] 3.1 Wrap `RouterProvider` in `src/main.tsx` with `LocaleProvider` then `ThemeProvider` (inside `I18nProvider`, outside `RouterProvider`)
- [x] 3.2 Remove `LocaleProvider` and `ThemeProvider` from `src/signed-in-app.tsx`

## 4. Update bootstrap to accept initialLocale

- [x] 4.1 Update `bootstrap(ydoc, initialLocale: string)` signature in `src/crdt/doc.ts` to accept `initialLocale` and use it when seeding `user.locale` (only if absent)
- [x] 4.2 Update `CrdtProvider` in `src/crdt/crdt-provider.tsx` to read locale from `localStorage` before the doc is ready and pass it to `bootstrap()`
- [x] 4.3 Update `src/crdt/__tests__/` to cover the new `bootstrap` signature and seeding behaviour

## 5. Implement CrdtLocaleProvider and LocaleSynchronizer

- [x] 5.1 Create `src/crdt/locale-synchronizer.tsx` — a null-rendered component that calls `useLocale()` (outer context) and `useYDoc(localeSelector, Object.is)`, then syncs CRDT locale to `localStorage` via `setLocale` in a `useEffect`
- [x] 5.2 Create `src/crdt/crdt-locale-provider.tsx` — renders `<LocaleSynchronizer />` as a sibling before the inner `LocaleContext` override; replaces `setLocale` with a function that writes to `ydoc.getMap('user').set('locale', newLocale)` inside `ydoc.transact()`
- [x] 5.3 Mount `<CrdtLocaleProvider>` inside `CrdtProvider` in `src/crdt/crdt-provider.tsx`, wrapping `{children}` after `SyncEngine`
- [x] 5.4 Write tests for `CrdtLocaleProvider` and `LocaleSynchronizer` covering: initial mount sync, remote CRDT update propagation, and user-initiated locale change writing to CRDT

## 6. Add draft locale and theme selectors to auth page

- [x] 6.1 Add draft locale selector and theme selector controls to `src/auth/auth-entry.tsx` using `useLocale()` and `useTheme()`
- [x] 6.2 Add i18n strings for any new UI labels and run `pnpm i18n:extract`, then fill translations for `en` and `ru` locales

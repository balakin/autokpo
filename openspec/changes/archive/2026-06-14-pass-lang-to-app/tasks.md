## 1. App: Query-param locale resolution

- [x] 1.1 Add `?lang=` query parameter check to `readLocale()` in `src/i18n/locale-storage.ts` — between the localStorage early-return and the `navigator.language` fallback. Validate param against `LOCALES`, persist to localStorage when matched, return the resolved locale.
- [x] 1.2 ~~Add URL cleanup effect to `LocaleProvider`~~ Removed — the `?lang=` param is inert after first consumption and React Router's next navigation replaces it naturally. in `src/i18n/locale-provider.tsx` — a `useEffect` that calls `history.replaceState` to strip the `?lang=` parameter from the URL after the locale has been resolved on mount.
- [x] 1.3 Write unit tests for `readLocale()` covering: valid `?lang=` hint consumed and persisted, invalid `?lang=` ignored and falls through, `?lang=` ignored when localStorage already has a value.

## 2. Website: Add `?lang=` to app links

- [x] 2.1 Update the header "Open App" button in `src/components/site-header.astro` to include `?lang=${currentLocale}` in the `href`.
- [x] 2.2 Update the hero CTA "Open App" button in `src/components/landing-page.astro` to include `?lang=${content.locale}` in the `href`.
- [x] 2.3 Update the final CTA "Open App" button in `src/components/landing-page.astro` to include `?lang=${content.locale}` in the `href`.

## 3. Verification

- [x] 3.1 Verify app tests pass with `pnpm -s test --reporter=verbose` (scoped to changed files).
- [x] 3.2 Verify website builds without errors with `pnpm -s build` scoped to the website package.
- [x] 3.3 Manual verification (deferred to post-deploy)

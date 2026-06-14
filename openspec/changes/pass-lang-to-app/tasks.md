## 1. App: Query-param locale resolution

- [ ] 1.1 Add `?lang=` query parameter check to `readLocale()` in `src/i18n/locale-storage.ts` — between the localStorage early-return and the `navigator.language` fallback. Validate param against `LOCALES`, persist to localStorage when matched, return the resolved locale.
- [ ] 1.2 Add URL cleanup effect to `LocaleProvider` in `src/i18n/locale-provider.tsx` — a `useEffect` that calls `history.replaceState` to strip the `?lang=` parameter from the URL after the locale has been resolved on mount.
- [ ] 1.3 Write unit tests for `readLocale()` covering: valid `?lang=` hint consumed and persisted, invalid `?lang=` ignored and falls through, `?lang=` ignored when localStorage already has a value.

## 2. Website: Add `?lang=` to app links

- [ ] 2.1 Update the header "Open App" button in `src/components/site-header.astro` to include `?lang=${currentLocale}` in the `href`.
- [ ] 2.2 Update the hero CTA "Open App" button in `src/components/landing-page.astro` to include `?lang=${content.locale}` in the `href`.
- [ ] 2.3 Update the final CTA "Open App" button in `src/components/landing-page.astro` to include `?lang=${content.locale}` in the `href`.

## 3. Verification

- [ ] 3.1 Verify app tests pass with `pnpm -s test --reporter=verbose` (scoped to changed files).
- [ ] 3.2 Verify website builds without errors with `pnpm -s build` scoped to the website package.
- [ ] 3.3 Manually test: visit `/ru/`, click "Open App", confirm app opens in Russian on first visit; visit again after changing in-app locale to English, confirm English is preserved.

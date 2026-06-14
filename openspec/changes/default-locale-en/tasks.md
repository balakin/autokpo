## 1. App — default locale constant

- [x] 1.1 Change `DEFAULT_LOCALE` from `'sr-Latn'` to `'en'` in `apps/app/src/i18n/i18n.ts`
- [x] 1.2 Run `pnpm -s test --reporter=verbose` in `apps/app` and verify all tests pass

## 2. Website — Astro config

- [x] 2.1 Change `defaultLocale` from `'sr-Latn'` to `'en'` in `astro.config.ts` (both `i18n` and `sitemap.i18n` sections)
- [x] 2.2 Change `defaultLocale` from `'sr-Latn'` to `'en'` in `wrangler.jsonc` if present

## 3. Website — page file reorganization

- [x] 3.1 Move `src/pages/en/index.astro` to `src/pages/index.astro` (overwriting current Serbian root)
- [x] 3.2 Move `src/pages/en/privacy/` to `src/pages/privacy/` (overwriting current Serbian privacy)
- [x] 3.3 Move `src/pages/en/terms/` to `src/pages/terms/` (overwriting current Serbian terms)
- [x] 3.4 Create directory `src/pages/sr-Latn/` and move current `src/pages/index.astro` there (only if it was the Serbian index — check file content to confirm)
- [x] 3.5 Create `src/pages/sr-Latn/privacy/` and move Serbian privacy content there
- [x] 3.6 Create `src/pages/sr-Latn/terms/` and move Serbian terms content there
- [x] 3.7 Remove empty `src/pages/en/` directory

## 4. Website — content data updates

- [x] 4.1 In `src/i18n/landing.ts`, change `'sr-Latn'` `route` from `'/'` to `'/sr-Latn/'`
- [x] 4.2 In `src/i18n/landing.ts`, change `'en'` `route` from `'/en/'` to `'/'`

## 5. Website — hardcoded locale references

- [x] 5.1 In `src/components/landing-page.astro`, change x-default hreflang from `'sr-Latn'` to `'en'`
- [x] 5.2 In `src/layouts/legal-document-layout.astro`, change x-default hreflang from `'sr-Latn'` to `'en'`
- [x] 5.3 In `src/pages/404.astro`, change primary locale references from `'sr-Latn'` to `'en'`

## 6. Website — verify and tests

- [x] 6.1 Run `pnpm -s build` in `apps/website` and verify build succeeds
- [x] 6.2 Manually verify generated output: `/` serves English, `/sr-Latn/` serves Serbian, `/ru/` serves Russian
- [x] 6.3 Verify all hreflang and canonical tags on generated pages
- [x] 6.4 Verify the sitemap reflects new locale URL structure

## 1. Website Copy

- [ ] 1.1 Update English, Serbian Latin, and Russian landing metadata to use KPO record-keeping for flat-rate entrepreneurs in Serbia terminology.
- [ ] 1.2 Update landing hero, feature, trust/security, FAQ, and final CTA copy where product positioning appears.
- [ ] 1.3 Keep CTA labels, navigation labels, and footer links compact so existing website layout remains stable.

## 2. App Static Metadata

- [ ] 2.1 Update `apps/app/index.html` description and Open Graph description to the unified English app metadata sentence.
- [ ] 2.2 Update the VitePWA manifest description in `apps/app/vite.config.ts` to the same unified English product sentence.
- [ ] 2.3 Preserve app shell `robots`, title, OG URL, OG image, and Twitter card behavior.

## 3. In-App Help Copy

- [ ] 3.1 Update the Help page About text source to describe AutoKPO as a free open-source app for KPO record-keeping.
- [ ] 3.2 Preserve compact and official labels such as Taxpayer, TIN, Books, Entries, Profile, and Settings where they are not product-positioning copy.
- [ ] 3.3 Avoid the primary English/Russian phrase "Book of Achieved Turnover" or literal equivalents in visible help product copy.

## 4. Localization Catalogs

- [ ] 4.1 Run app i18n extraction after source string changes.
- [ ] 4.2 Fill updated `en` and `ru` translations for app source strings.
- [ ] 4.3 Verify website copy remains localized in `apps/website/src/i18n/landing.ts` without introducing catalog drift.

## 5. Verification

- [ ] 5.1 Run targeted tests or build checks covering app metadata/PWA manifest behavior if existing tests assert those strings.
- [ ] 5.2 Run relevant app help-page tests and update expected copy only where intentionally changed.
- [ ] 5.3 Run website build/check or targeted website tests to verify localized landing pages still render.
- [ ] 5.4 Review compact labels in English and Russian for obvious layout-length regressions before finalizing.

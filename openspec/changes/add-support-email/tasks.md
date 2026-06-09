## 1. App — Help Page

- [ ] 1.1 Add `mailto:support@autokpo.com` link as a second item in the "Kako prijaviti problem" card in `apps/app/src/help/help-page.tsx`, below the GitHub Issues `ExternalLink`, using the same `ExternalLink` component with a `<Trans>` label
- [ ] 1.2 Run `cd apps/app && pnpm -s i18n:extract` to update `.po` files with the new string
- [ ] 1.3 Fill in `en` translation for the new string in `apps/app/src/locales/en.po`
- [ ] 1.4 Fill in `ru` translation for the new string in `apps/app/src/locales/ru.po`

## 2. Website — Footer

- [ ] 2.1 Add a `support` field (string type) to `LandingContent` in `apps/website/src/i18n/landing.ts` and populate the label for all three locales (`sr-Latn`, `en`, `ru`)
- [ ] 2.2 Add a `mailto:support@autokpo.com` anchor inside `.footer-legal-links` in `apps/website/src/components/site-footer.astro`, using `content.support` as the link text

## 3. Verification

- [ ] 3.1 Run `cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:'` — confirm no type errors
- [ ] 3.2 Run `cd apps/app && pnpm -s test --reporter=verbose | tail -n 60` — confirm help-page tests still pass
- [ ] 3.3 Run `cd apps/website && pnpm -s build 2>&1 | grep -E 'error'` — confirm website builds cleanly

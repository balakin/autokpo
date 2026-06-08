## 1. Website — Remove Cookies Pages

- [x] 1.1 Delete `apps/website/src/pages/cookies/index.md`
- [x] 1.2 Delete `apps/website/src/pages/en/cookies/index.md`
- [x] 1.3 Delete `apps/website/src/pages/ru/cookies/index.md`

## 2. Website — Remove Cookies from i18n

- [x] 2.1 Remove `cookies` from `LegalDocumentKey` type in `apps/website/src/i18n/legal.ts`
- [x] 2.2 Remove `cookies` property from all `createDocuments` calls / locale content in `apps/website/src/i18n/legal.ts`
- [x] 2.3 Remove `cookies` from `legalLinks` content for all three locales in `apps/website/src/i18n/landing.ts`

## 3. Website — Remove Cookies Link from Footer

- [x] 3.1 Remove the `cookies` prop from `legalUrls` in `apps/website/src/components/site-footer.astro` (both the interface and the link element)
- [x] 3.2 Update all callers that pass `legalUrls` to `site-footer.astro` to drop the `cookies` property

## 4. App — Remove Cookies from Legal Links

- [x] 4.1 Remove `'cookies'` from `LegalDocument` type in `apps/app/src/legal/legal-links.ts`
- [x] 4.2 Remove `cookies` property from the `getLegalLinks` return object in `apps/app/src/legal/legal-links.ts`

## 5. App — Update Tests

- [x] 5.1 Remove `cookies` assertions from `apps/app/src/legal/__tests__/legal-links.spec.ts`
- [x] 5.2 Remove `cookies` URL assertions from `apps/app/src/auth/__tests__/auth-shell.spec.tsx`
- [x] 5.3 Remove `cookies` URL assertions from `apps/app/src/e2ee/__tests__/encryption-shell.spec.tsx`
- [x] 5.4 Remove `cookies` URL assertions from `apps/app/src/help/__tests__/help-page.spec.tsx`

## 6. Verify

- [x] 6.1 Run `cd apps/app && pnpm -s test --reporter=verbose | tail -n 60` — all tests pass
- [x] 6.2 Run `cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:' | head -n 20` — no type errors

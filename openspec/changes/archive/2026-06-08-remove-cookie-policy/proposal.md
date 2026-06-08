## Why

The app uses only strictly necessary cookies (session authentication), which are already documented in the Privacy Policy. A separate Cookie Policy page is redundant and adds unnecessary maintenance surface.

## What Changes

- Remove all three `/cookies/` website pages (sr-Latn, en, ru)
- Remove the Cookies Policy link from the website footer
- Remove cookies URL from the `app-legal-links` module and its `LegalLinks` type
- Remove the `cookies` key from `LegalDocumentKey` in website i18n
- Remove `cookies` entries from landing i18n content (all three locales)
- Remove cookies page routes and any routing logic referencing `/cookies/`
- Update all tests that reference cookies legal links

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `website-legal-documents`: Remove Cookies Policy from the set of legal document pages; only Privacy Policy and Terms of Service remain.
- `app-legal-links`: Remove `cookies` from `LegalDocument` type and `LegalLinks` record; only `terms` and `privacy` remain.

## Impact

- `apps/website/src/pages/cookies/` (and `en/cookies/`, `ru/cookies/`) — deleted
- `apps/website/src/components/site-footer.astro` — remove cookies link
- `apps/website/src/i18n/legal.ts` — remove `cookies` from `LegalDocumentKey` and all locale content
- `apps/website/src/i18n/landing.ts` — remove `cookies` from `legalLinks` content
- `apps/app/src/legal/legal-links.ts` — remove `cookies` from `LegalDocument` type and `getLegalLinks` return value
- All spec tests referencing `cookies` legal links (`legal-links.spec.ts`, `help-page.spec.tsx`, `encryption-shell.spec.tsx`, `auth-shell.spec.tsx`)
- `openspec/specs/website-legal-documents/spec.md` and `openspec/specs/app-legal-links/spec.md` — spec updates

## Context

The website currently exposes three legal document pages per locale: Privacy Policy, Terms of Service, and Cookies Policy. The Cookies Policy is redundant because the app uses only strictly necessary session cookies, which are already covered in the Privacy Policy. Removing the Cookies Policy simplifies the legal surface and eliminates dead content.

## Goals / Non-Goals

**Goals:**

- Delete the three `/cookies/` page source files (sr-Latn, en, ru)
- Remove the Cookies Policy link from the website footer and landing page legal link set
- Remove `cookies` from the `LegalDocument` union type and `getLegalLinks` return object in the app
- Remove `cookies` from website i18n (`LegalDocumentKey`, `legal.ts` content, `landing.ts` legalLinks)
- Update all tests that snapshot or assert on cookies legal links

**Non-Goals:**

- Changing Privacy Policy or Terms of Service content
- Altering routing infrastructure (no new redirects needed — the cookies URL was never linked from the app)
- Any UI redesign of footers beyond removing the cookies link

## Decisions

### No redirect from `/cookies/` to `/privacy/`

The cookies pages contain placeholder lorem ipsum content and have never been linked from the app. A permanent redirect would add routing complexity with no real user benefit. Decision: delete without redirect.

### Remove `cookies` from `LegalDocument` type entirely

Keeping `cookies` as an optional/deprecated key would leave dead code and confuse future type consumers. Decision: hard-delete from the union type and all callsites in one pass.

## Risks / Trade-offs

- [Broken link if someone bookmarked `/cookies/`] → Acceptable; placeholder-only content, no SEO value, no app links.
- [Test churn] → Several test files assert on cookies URLs; they all need updating. Low risk — mechanical changes.

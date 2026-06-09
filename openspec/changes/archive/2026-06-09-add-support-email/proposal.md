## Why

Users who need help — whether they have an account or not — currently have only GitHub Issues as a contact channel. A dedicated support email (`support@autokpo.com`) gives users a direct, familiar way to reach the team without requiring a GitHub account.

## What Changes

- **App help page**: add `support@autokpo.com` as a second contact item in the existing "Report a problem" card, alongside the GitHub Issues link.
- **Website footer**: add a `mailto:support@autokpo.com` link in the footer's legal-links row (Privacy · Terms · support@autokpo.com), present on all three locales (sr-Latn, en, ru).

## Capabilities

### New Capabilities

_(none — this change extends existing surfaces)_

### Modified Capabilities

- `help-page`: the help page now includes a support email contact option in the "Report a problem" card.
- `website-landing-page`: the website footer now includes the support email link across all locales.

## Impact

- `apps/app/src/help/help-page.tsx` — add email link item; add i18n strings for label text in all three locales (`sr-Latn.po`, `en.po`, `ru.po`).
- `apps/website/src/components/site-footer.astro` — add `mailto:` anchor in `.footer-legal-links`.
- `apps/website/src/i18n/landing.ts` — add a `support` field (link label text) to `LandingContent` and populate all three locale objects.

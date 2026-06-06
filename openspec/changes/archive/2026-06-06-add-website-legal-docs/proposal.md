## Why

The public website needs stable, discoverable legal document pages for cookies, privacy, and terms so visitors can review project policies before opening the app. The current iteration should establish localized page templates and navigation without committing final legal copy yet.

## What Changes

- Add Markdown-rendered legal document template pages to `apps/website` for Cookies Policy, Privacy Policy, and Terms of Service.
- Provide each document in every supported website locale: Serbian Latin, English, and Russian.
- Use English URL slugs for all locales, with Serbian Latin as the default unprefixed locale.
- Populate documents with localized lorem ipsum placeholder content for now.
- Extract shared website shell components (`base-layout.astro`, `site-header.astro`, `site-footer.astro`) from the landing page so legal pages reuse the same HTML shell, fonts, theme variables, and light/dark toggle.
- Add localized footer links on both landing and legal pages so visitors can conveniently reach all three legal documents.
- Keep the legal pages visually aligned with the existing website theme, header/footer, local fonts, favicon setup, and light/dark theme behavior.

## Capabilities

### New Capabilities

- `website-legal-documents`: Public localized legal document pages, Markdown rendering, stable routes, metadata, and shared document layout behavior.

### Modified Capabilities

- `website-landing-page`: Footer requirements expand to include convenient localized links to Cookies Policy, Privacy Policy, and Terms of Service.
- `website-localization`: Static localized website routing expands beyond landing pages to include legal document routes with English slugs across locales.

## Impact

- Affected package: `apps/website`.
- New files: `src/components/site-footer.astro`, `src/components/site-header.astro`, `src/i18n/legal.ts`, `src/layouts/base-layout.astro`, `src/layouts/legal-document-layout.astro`, and nine Markdown legal document pages under `src/pages/{privacy,terms,cookies}/` and `src/pages/{en,ru}/{privacy,terms,cookies}/`.
- Modified files: `src/components/LandingPage.astro` (renamed to `landing-page.astro` and restructured to use shared components), `src/i18n/landing.ts` (refactored to expose footer legal link labels), and locale-specific `index.astro` pages (updated imports).
- No backend, worker, authenticated app, API, or database changes.
- No new runtime Markdown parser is required; Astro's built-in Markdown page rendering should be preferred.

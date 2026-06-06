## Why

The public website needs stable, discoverable legal document pages for cookies, privacy, and terms so visitors can review project policies before opening the app. The current iteration should establish localized page templates and navigation without committing final legal copy yet.

## What Changes

- Add Markdown-rendered legal document template pages to `apps/website` for Cookies Policy, Privacy Policy, and Terms of Service.
- Provide each document in every supported website locale: Serbian Latin, English, and Russian.
- Use English URL slugs for all locales, with Serbian Latin as the default unprefixed locale.
- Populate documents with localized lorem ipsum placeholder content for now.
- Add localized footer links on the website so visitors can conveniently reach all three legal documents.
- Keep the legal pages visually aligned with the existing website theme, header/footer, local fonts, favicon setup, and light/dark theme behavior.

## Capabilities

### New Capabilities

- `website-legal-documents`: Public localized legal document pages, Markdown rendering, stable routes, metadata, and shared document layout behavior.

### Modified Capabilities

- `website-landing-page`: Footer requirements expand to include convenient localized links to Cookies Policy, Privacy Policy, and Terms of Service.
- `website-localization`: Static localized website routing expands beyond landing pages to include legal document routes with English slugs across locales.

## Impact

- Affected package: `apps/website`.
- Likely affected files: Astro pages/layouts/components under `apps/website/src`, website i18n content, and the existing landing footer.
- No backend, worker, authenticated app, API, or database changes.
- No new runtime Markdown parser is required; Astro's built-in Markdown page rendering should be preferred.

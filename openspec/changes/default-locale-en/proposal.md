## Why

The app and marketing website currently default to Serbian Latin (`sr-Latn`) when browser language detection fails or no stored preference exists. For an international audience, English is the more appropriate lingua franca fallback — a German or Chinese visitor should see English, not Serbian. Serbian users are still correctly detected via `navigator.language`.

## What Changes

- **App**: `DEFAULT_LOCALE` constant changes from `sr-Latn` to `en`. The locale detection chain becomes `localStorage → navigator.language → en`. No source code strings change — `<Trans>` content remains in Serbian Latin.
- **Website**: Astro `defaultLocale` flips from `sr-Latn` to `en`. English landing moves to `/` (unprefixed), Serbian Latin landing moves to `/sr-latn/`. Russian stays at `/ru/`. All hreflang `x-default` tags point to English.
- **App legal links**: Automatically adapt — `getLegalLinks()` derives URL prefixes from `DEFAULT_LOCALE`, so links to the website correct themselves when the constant changes.

## Capabilities

### New Capabilities

None. This is a configuration change, not a new capability.

### Modified Capabilities

- **i18n**: The final fallback locale changes from `sr-Latn` to `en`. Spec scenarios that reference `sr-Latn` as the hard fallback are updated.
- **website-localization**: The default unprefixed locale changes from `sr-Latn` to `en`. URL structure scenarios are updated to reflect new paths.
- **app-legal-links**: The URL mapping table is updated — `en` now maps to unprefixed routes (`/terms/`, `/privacy/`) and `sr-Latn` maps to prefixed routes (`/sr-latn/terms/`, `/sr-latn/privacy/`).

## Impact

- `apps/app/src/i18n/i18n.ts` — `DEFAULT_LOCALE` constant
- `apps/website/astro.config.ts` — `defaultLocale` in both `i18n` and `sitemap.i18n` sections
- `apps/website/src/i18n/landing.ts` — `route` values for `en` and `sr-Latn`
- `apps/website/src/pages/` — directory reorganization (file moves)
- `apps/website/src/components/landing-page.astro` — x-default hreflang reference
- `apps/website/src/layouts/legal-document-layout.astro` — x-default hreflang reference
- `apps/website/src/pages/404.astro` — primary locale for meta title

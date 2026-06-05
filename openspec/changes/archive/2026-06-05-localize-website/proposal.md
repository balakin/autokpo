## Why

The public Astro website currently serves only Serbian Latin copy at the root URL, limiting its usefulness for visitors who prefer English or Russian. Adding static localization lets the landing page address Serbian Latin, English, and Russian audiences while preserving the simple static deployment model.

## What Changes

- Configure the Astro website for built-in i18n with `sr-Latn` as the default locale and unprefixed default-language URLs.
- Serve Serbian Latin landing content at `/`, English at `/en/`, and Russian at `/ru/`.
- Localize landing-page metadata, navigation labels, hero copy, section content, FAQ, calls to action, footer copy, and accessibility labels.
- Add a visible language switcher that links between the equivalent localized landing pages.
- Add locale-aware SEO metadata, including `lang`, canonical URLs, and `hreflang` alternates.
- Preserve the current static Astro architecture, visual design, theme toggle behavior, assets, app CTA, and GitHub links.

## Capabilities

### New Capabilities

- `website-localization`: Covers static multilingual routing, localized website copy, language switching, and locale-aware SEO for the public Astro website.

### Modified Capabilities

- `website-landing-page`: Updates the landing page from Serbian Latin-only presentation to a localized public landing experience while keeping Serbian Latin as the default root page.

## Impact

- Affects `apps/website/astro.config.ts` and the Astro page structure under `apps/website/src/pages/`.
- Likely introduces shared website localization data and/or components under `apps/website/src/` to avoid duplicating the monolithic landing page for each locale.
- Requires English and Russian translations for all existing Serbian Latin landing content.
- Requires `astro check --tsconfig tsconfig.app.json` and `astro build` to continue passing for the static website.

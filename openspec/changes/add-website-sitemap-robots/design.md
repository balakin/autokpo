## Context

`apps/website` is a static Astro site deployed to Cloudflare via `wrangler deploy`. The config already declares `site: 'https://autokpo.com'` and i18n with `defaultLocale: 'sr-Latn'` (no URL prefix) plus `en` and `ru` prefixed locales. There is no `robots.txt` and no sitemap. `@astrojs/sitemap` is an official Astro integration that hooks into the build pipeline and emits sitemap files automatically.

## Goals / Non-Goals

**Goals:**

- Generate a valid XML sitemap with i18n alternate links at build time
- Serve a `robots.txt` that permits all crawlers and points to the sitemap
- Zero runtime overhead — everything is static

**Non-Goals:**

- Custom sitemap filtering or priority/changefreq tuning (default values are fine)
- `noindex` directives on any page
- Dynamic sitemap regeneration (static build is sufficient)

## Decisions

### Use `@astrojs/sitemap` integration

The integration reads Astro's i18n config and the pages emitted by the build, then writes `sitemap-index.xml` + `sitemap-0.xml` to `dist/`. It automatically adds `xhtml:link rel="alternate"` entries when `i18n` is configured in `astro.config.ts`.

**Alternative considered**: hand-authored static `sitemap.xml` in `public/`. Rejected — it would go stale as pages are added and would require manual maintenance of alternate-language links.

### `robots.txt` as a static file in `public/`

Astro copies everything in `public/` verbatim to `dist/`. A static `robots.txt` is the simplest possible approach.

**Alternative considered**: generating `robots.txt` via an Astro endpoint (`.ts` route). Unnecessary complexity for a file that never changes.

### No `i18n.routing` config change needed

`@astrojs/sitemap` reads the `i18n.locales` and `i18n.defaultLocale` already present in `astro.config.ts`. The default locale's pages appear without a prefix (`/`, `/privacy/`, `/terms/`) and prefixed locales appear with their prefix (`/en/`, `/ru/`). No additional routing configuration is required.

## Risks / Trade-offs

- **`/404` page inclusion**: Astro's sitemap integration may include `/404` depending on version behavior. The integration supports a `filter` option to exclude specific paths — add `filter: (page) => page !== 'https://autokpo.com/404/'` if the 404 page appears in the output.
- **`/cookies/` routes**: The existing `website-localization` spec references `/cookies/` routes, but no cookie pages currently exist in the source tree. The sitemap will only include pages that are actually built — no action needed.

## Migration Plan

1. Install `@astrojs/sitemap` in `apps/website`
2. Register integration in `astro.config.ts`
3. Add `public/robots.txt`
4. Build locally and verify `dist/sitemap-index.xml`, `dist/sitemap-0.xml`, and `dist/robots.txt` are present and correct
5. Deploy with `wrangler deploy`

No rollback complexity — these are additive static files.

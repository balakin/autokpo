## Why

The autokpo.com website has no `robots.txt` or sitemap, which means search engines have no structured way to discover all pages and no explicit crawl permissions. Adding these is a baseline SEO hygiene step before the site is promoted.

## What Changes

- Add `@astrojs/sitemap` integration to `apps/website/astro.config.ts` — automatically generates `/sitemap-index.xml` and `/sitemap-0.xml` at build time, with i18n alternate-language links for all three locales
- Add `public/robots.txt` that allows all crawlers and references the sitemap URL

## Capabilities

### New Capabilities

- `website-sitemap-robots`: XML sitemap and robots.txt for the autokpo.com website, covering all indexable pages across sr-Latn (default), en, and ru locales

### Modified Capabilities

- `website-localization`: sitemap must correctly reflect the i18n routing structure (default locale at `/`, prefixed locales at `/en/` and `/ru/`)

## Impact

- `apps/website/package.json` — add `@astrojs/sitemap` devDependency
- `apps/website/astro.config.ts` — register sitemap integration
- `apps/website/public/robots.txt` — new static file
- Build output: new `/sitemap-index.xml` and `/sitemap-0.xml` files in `dist/`

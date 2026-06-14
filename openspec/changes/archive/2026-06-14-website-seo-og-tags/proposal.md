## Why

The autokpo.com marketing website has no Open Graph or Twitter card meta tags, so social previews on Slack, iMessage, LinkedIn, and Twitter/X show bare text with no image. The 404 page also lacks a `noindex` directive, meaning it can appear in search results.

## What Changes

- Add optional OG/Twitter props to `base-layout.astro` and output `og:title`, `og:description`, `og:site_name`, `og:type`, `og:url`, `og:image`, and `twitter:card` in `<head>`
- Pass OG props from `landing-page.astro` (type `website`, locale-specific image, `summary_large_image` card)
- Pass OG props from `legal-document-layout.astro` (type `article`, locale-specific image, `summary` card)
- Add `<meta name="robots" content="noindex">` to `404.astro`
- Add one shared placeholder social image (`public/og-image.png`) at 1200×630px — design work, referenced by code
- Strip `robots.txt` to the sitemap line only (Cloudflare manages crawl rules)

## Capabilities

### New Capabilities

- `og-social-tags`: Open Graph and Twitter card meta tags emitted per page via `base-layout.astro` props, with locale-specific social images for landing and legal pages
- `seo-indexing-rules`: Explicit `noindex` on the 404 page; `robots.txt` reduced to sitemap pointer only

### Modified Capabilities

<!-- none -->

## Impact

- `apps/website/src/layouts/base-layout.astro` — Props interface extended; new meta tags in `<head>`
- `apps/website/src/components/landing-page.astro` — Passes new OG props to BaseLayout
- `apps/website/src/layouts/legal-document-layout.astro` — Passes new OG props to BaseLayout
- `apps/website/src/pages/404.astro` — Adds noindex meta tag
- `apps/website/public/robots.txt` — Simplified to sitemap line only
- `apps/website/public/og-image.png` — One new shared image file (placeholder, design work)
- No new npm dependencies

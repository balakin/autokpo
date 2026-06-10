## Why

The website has no 404 page, so visitors who land on a broken or mistyped URL see Cloudflare's default error screen — off-brand and unhelpful. Adding a styled 404 page keeps the experience consistent and gives users a clear path back.

## What Changes

- Add `src/pages/404.astro` to `apps/website` — a single static 404 page using the existing `base-layout.astro`
- Add `wrangler.jsonc` to `apps/website` with `not_found_handling: "404-page"` so Cloudflare Workers serves the custom page on any unmatched URL
- Add wrangler as a dev dependency to `apps/website`

## Capabilities

### New Capabilities

- `website-404-page`: Custom 404 error page for the AutoKPO marketing website — visually consistent with the site, with links back to the homepage in all supported locales

### Modified Capabilities

- `website-landing-page`: Deployment target changes — the website now ships with a `wrangler.jsonc` for Cloudflare Workers static asset hosting

## Impact

- `apps/website/src/pages/404.astro` — new file
- `apps/website/wrangler.jsonc` — new file
- `apps/website/package.json` — add `wrangler` dev dependency

## Context

`apps/website` is a pure static Astro site (no SSR adapter) targeting Cloudflare Workers static asset hosting. Currently there is no `wrangler.jsonc` and no `404.astro` page. Without `not_found_handling: "404-page"` in the Wrangler config, Cloudflare returns its own default error screen for unmatched URLs.

The site supports three locales (`sr-Latn`, `en`, `ru`). Because Cloudflare static assets serve a single `404.html` for all unmatched routes regardless of URL prefix, a locale-specific 404 is not feasible without a Worker script — which is out of scope.

## Goals / Non-Goals

**Goals:**

- Add a branded 404 page that reuses the existing visual system (`base-layout.astro`, CSS variables, fonts)
- Configure `wrangler.jsonc` in `apps/website` so Cloudflare Workers serves `dist/404.html` for unmatched URLs
- Give users clear navigation back to all three locale homepages

**Non-Goals:**

- Locale-specific 404 content (single `404.html` served regardless of URL locale)
- A Worker script for dynamic locale detection on 404
- CI/CD wiring or Workers Builds configuration (deploy workflow is separate)

## Decisions

### Decision: Single-locale 404 page (sr-Latn primary, locale links for others)

**Chosen:** One `404.astro` page rendered in sr-Latn, with visible links to `/`, `/en/`, `/ru/` so users of any locale can self-navigate.

**Alternatives considered:**

- _Locale-aware 404 via Worker script_: Would require adding the `@astrojs/cloudflare` adapter and SSR, which is substantial complexity for a static marketing site.
- _JavaScript-based redirect_: Detect `navigator.language` client-side and redirect. Fragile, adds flash, anti-pattern for a 404 page.

**Rationale:** The site's primary audience is sr-Latn; the 404 case is rare. A simple static page with links to all locale roots is correct and proportionate.

### Decision: `wrangler.jsonc` in `apps/website`, not shared with `apps/app`

Each package manages its own Wrangler config. The website is a separate Worker from the main app and must not share config.

### Decision: No `@astrojs/cloudflare` adapter

The site is fully static (no SSR, no server islands). Astro docs explicitly state the adapter is not needed for static site builders. The wrangler config's `assets.directory: "./dist"` is sufficient.

## Risks / Trade-offs

- **Single `404.html` for all locales** → Users hitting a 404 on `/ru/foo` see sr-Latn copy, but locale links are present to recover. Acceptable for a low-traffic error page.
- **`wrangler.jsonc` adds a new deploy artifact** → If the website is deployed via CI, the pipeline will need to run `wrangler deploy` from `apps/website`. Out of scope for this change but noted.

## Migration Plan

1. Add `wrangler` dev dependency to `apps/website/package.json`
2. Create `apps/website/wrangler.jsonc`
3. Create `apps/website/src/pages/404.astro`
4. Verify `astro build` produces `dist/404.html`
5. Deploy with `wrangler deploy` from `apps/website`

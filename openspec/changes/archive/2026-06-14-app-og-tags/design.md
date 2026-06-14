## Context

The AutoKPO PWA is a pure client-side React SPA with no SSR. The existing `index.html` shell has a `<title>`, PWA icons, and a `noindex` robots tag, but no Open Graph, Twitter Card, or `<meta name="description">` tags. The previously-archived `website-seo-og-tags` change added OG tags to the marketing website (Astro/SSR), but the app was not covered.

OG crawlers (Facebook, Twitter, etc.) do not execute JavaScript — they only see the static HTML shell. This makes route-specific OG tags infeasible without SSR or a prerendering service.

## Goals / Non-Goals

**Goals:**

- Add fixed OG/Twitter tags and a meta description to `apps/app/index.html` so sharing `https://app.autokpo.com` shows a branded link preview with image, title, and description
- Use English for title/description — static HTML cannot be localized per user locale
- Reuse the shared `og-image.png` placeholder already created for the marketing website

**Non-Goals:**

- Route-specific OG tags (requires SSR — out of scope)
- Dynamic `<title>` updates via `document.title` (separate UX improvement)
- Changing the `robots` meta (already `noindex, nofollow`, appropriate for the app)

## Decisions

### Static OG tags in index.html (not a head-management library)

**Choice:** Write tags directly into the HTML shell.

**Why:** OG crawlers do not execute JS. Libraries like `@unhead/react` or `react-helmet` can update `document.title` at runtime for browser tab UX, but they cannot help crawlers see OG tags. Adding a library would only benefit in-app UX (tab title changes), which is a separate concern.

**Alternative considered:** `@unhead/react` — would enable dynamic per-route titles for browser tabs, but adds a dependency and doesn't help crawlers. Deferred as a separate change.

### Language: English only for static OG content

**Choice:** `og:title`, `og:description`, and `<meta name="description">` are hardcoded in English.

**Why:** The HTML shell is static — there is no per-request server to serve locale-specific tags. The app already has a single `<html lang="en">`. English is the universal fallback; localized descriptions would require SSR.

### og:type = "website", twitter:card = "summary"

**Choice:** Conservative card types. `website` is the default OG type. `summary` renders a small square thumbnail on Twitter/X, which is appropriate for a tool/product page (as opposed to `summary_large_image` which is better for article/blog content).

**Alternative considered:** `summary_large_image` — would show a larger preview image on Twitter/X but is more appropriate for content pages like the landing page. The app's purpose (a tool) is better served by the smaller `summary` card.

### Image: reuse `/og-image.png` from the marketing website

**Choice:** The app's `public/og-image.png` should be the same shared placeholder used by the website. Since the app is deployed to `app.autokpo.com`, the image URL in the OG tag will point to `https://app.autokpo.com/og-image.png`.

If the file doesn't exist in `apps/app/public/`, we'll copy it from `apps/website/public/og-image.png`. Both deployments serve from their own origin, so each needs its own copy.

## Risks / Trade-offs

- [Crawler caching] → OG crawlers cache preview data aggressively (days/weeks). Updating the image or description later may not propagate quickly. Mitigation: Use the debugger tools (Facebook Sharing Debugger, Twitter Card Validator) to force a re-scrape after deploy.
- [Same image for all routes] → All shared links to `app.autokpo.com` (regardless of deep-link path) will show the same OG preview. Since crawlers only see the shell, this is unavoidable without SSR.

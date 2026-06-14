## Context

The autokpo.com website is a static Astro site deployed to Cloudflare Workers. It has three locales (`sr-Latn` default at `/`, `en` at `/en/`, `ru` at `/ru/`), two page types (landing, legal), and a 404 page. All pages share `base-layout.astro` as the HTML shell.

The layout already has a clean `<slot name="head">` that child components fill with canonical and hreflang tags. Title and description are already props on `BaseLayout`. The `site` URL (`https://autokpo.com`) is set in `astro.config.ts`.

Social images are design work delivered separately as 1200×630 PNG files placed in `public/`.

## Goals / Non-Goals

**Goals:**

- Emit standard OG and Twitter card meta tags on all indexable pages
- Support locale-specific `og:image` without coupling the layout to locale logic
- Add `noindex` to the 404 page
- Simplify `robots.txt` to a sitemap pointer

**Non-Goals:**

- Structured data / JSON-LD
- Dynamic OG image generation
- Adding the `astro-seo` package
- Changing canonical or hreflang logic (already correct)

## Decisions

### 1. Extend `BaseLayout` props rather than a separate SEO component

OG tags are optional per-page metadata — the same category as `title` and `description`, which are already BaseLayout props. Adding optional OG props (`ogType?`, `ogUrl?`, `ogImage?`, `twitterCard?`) keeps all head metadata in one place and avoids an extra component abstraction.

`og:title` and `og:description` reuse the existing `title` and `description` props — no duplication. `og:site_name` is hardcoded to `"AutoKPO"` in the layout since it never varies.

**Alternative considered**: A separate `<SeoHead>` component filled via `slot="head"`. Rejected — adds indirection for no gain given the small number of pages and the fact that BaseLayout already owns head metadata.

### 2. Single shared social image, URL passed by callers

A single `public/og-image.png` is used across all locales and page types. Callers pass `ogImage` as an absolute URL (`https://autokpo.com/og-image.png`). BaseLayout treats it as an opaque string and emits it verbatim.

This keeps BaseLayout generic. A shared image avoids design overhead (no need for per-locale variants) and is the right choice when the image contains brand visuals rather than locale-specific text.

### 3. Astro `site` config as the base URL for image URLs

`getAbsoluteLocaleUrl` (already imported in both layout files) uses the `site` value from `astro.config.ts`. Image URLs can be constructed with `new URL('/og-en.png', Astro.site).href` in the caller, making them absolute without hardcoding the domain.

### 4. Legal pages use `twitter:card="summary"` (not `summary_large_image`)

Legal pages are unlikely to be shared socially. A smaller card is appropriate and avoids a large image preview on privacy/terms content.

### 5. `robots.txt` reduced to sitemap line only

The `Allow: /` directive is the default crawler behavior — stating it explicitly is redundant. Cloudflare handles any crawl restrictions at the edge. The sitemap pointer remains because it's a genuine signal to crawlers, not a default.

## Risks / Trade-offs

- **Placeholder image**: Until the designed `og-image.png` is added to `public/`, `og:image` tags will point to a non-existent URL. Crawlers will emit warnings but won't break indexing. Tasks should call this out explicitly.
- **No fallback image**: If `ogImage` prop is omitted, no `og:image` tag is emitted. This is intentional — a broken image URL is worse than no image tag.

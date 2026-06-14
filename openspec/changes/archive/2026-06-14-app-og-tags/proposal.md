## Why

The AutoKPO PWA (`app.autokpo.com`) has no Open Graph or Twitter Card meta tags in its HTML shell. Social link previews show bare text. Unlike the marketing website (which renders server-side via Astro), the app is a pure client-side SPA — crawlers won't execute JS, so OG tags must live in the static `index.html`.

## What Changes

- Add `og:title`, `og:description`, `og:site_name`, `og:type`, `og:url`, `og:image`, and `twitter:card` meta tags to `apps/app/index.html` — all in English (static HTML cannot be localized)
- Add a `<meta name="description">` tag in English for search snippets
- Reference the shared `og-image.png` already present in the marketing website (or add one to the app if needed — same file)
- Set `og:type` to `website` and `twitter:card` to `summary` (the app is a tool, not article content)

## Capabilities

### New Capabilities

- `app-og-social-tags`: Fixed Open Graph and Twitter Card meta tags in the app's `index.html` shell for social link previews

### Modified Capabilities

<!-- none -->

## Impact

- `apps/app/index.html` — New meta tags in `<head>`: `og:title`, `og:description`, `og:site_name`, `og:url`, `og:image`, `og:type`, `twitter:card`, and `<meta name="description">`
- `apps/app/public/og-image.png` — Shared placeholder social image (1200×630px) if not already present
- No new npm dependencies

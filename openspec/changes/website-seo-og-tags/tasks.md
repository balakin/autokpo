## 1. Placeholder Social Image

- [ ] 1.1 Add `public/og-image.png` placeholder (1200×630px) — design work, must exist before deployment so og:image tags resolve

## 2. robots.txt

- [ ] 2.1 Strip `public/robots.txt` to sitemap line only — remove `User-agent: *` and `Allow: /` directives

## 3. BaseLayout OG Props

- [ ] 3.1 Extend `Props` interface in `base-layout.astro` with optional `ogType?: 'website' | 'article'`, `ogUrl?: string`, `ogImage?: string`, `twitterCard?: 'summary' | 'summary_large_image'`
- [ ] 3.2 Destructure the new props in the frontmatter
- [ ] 3.3 Emit `og:title`, `og:description`, `og:site_name` tags in `<head>` when any OG prop is provided
- [ ] 3.4 Emit `og:type`, `og:url`, `og:image` tags conditionally when their respective props are provided
- [ ] 3.5 Emit `twitter:card` tag when `twitterCard` prop is provided

## 4. Landing Page OG Tags

- [ ] 4.1 In `landing-page.astro`, build `ogImage` URL using `Astro.site` (e.g. `new URL('/og-image.png', Astro.site).href`)
- [ ] 4.2 Pass `ogType="website"`, `ogUrl={canonicalUrl}`, `ogImage`, and `twitterCard="summary_large_image"` to `<BaseLayout>`

## 5. Legal Document Layout OG Tags

- [ ] 5.1 In `legal-document-layout.astro`, build `ogImage` URL using `Astro.site` (e.g. `new URL('/og-image.png', Astro.site).href`)
- [ ] 5.2 Pass `ogType="article"`, `ogUrl` (absolute canonical URL), `ogImage`, and `twitterCard="summary"` to `<BaseLayout>`

## 6. 404 noindex

- [ ] 6.1 Add `<meta name="robots" content="noindex">` to the `<head>` of `404.astro` via `BaseLayout`'s `slot="head"`

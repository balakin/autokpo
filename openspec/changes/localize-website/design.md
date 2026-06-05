## Context

`apps/website` is a small Astro 6 static landing website. The current implementation is a single `src/pages/index.astro` file containing the page shell, styling, theme toggle script, metadata, and all Serbian Latin marketing copy. `astro.config.ts` has no i18n configuration, and the existing website specification defines the landing page as Serbian Latin-focused.

Astro's built-in i18n routing supports static localized routes without `output: "server"`. Runtime browser language negotiation is not available for prerendered static pages, so this change will use deterministic URLs instead of server-side language detection.

## Goals / Non-Goals

**Goals:**

- Use Astro's built-in i18n configuration for `sr-Latn`, `en`, and `ru`.
- Keep Serbian Latin as the default locale at `/`, with English at `/en/` and Russian at `/ru/`.
- Keep the website fully static and compatible with the current `astro check && astro build` workflow.
- Avoid triplicating the full landing page markup by moving localized strings into typed shared data and rendering one shared landing template.
- Add localized document metadata, `lang`, canonical links, `hreflang` alternates, language switch links, and translated accessibility labels.
- Preserve existing visuals, static assets, theme toggle behavior, CTA targets, and legal/security messaging.

**Non-Goals:**

- No SSR adapter, custom server, middleware-only language detection, or `output: "server"` migration.
- No automatic `Accept-Language` redirect from `/`; `/` remains Serbian Latin.
- No per-locale domains.
- No localization of the authenticated React app; that already has a separate Lingui setup.

## Decisions

### Use built-in Astro i18n with an unprefixed default locale

Configure Astro with `locales: ["sr-Latn", "en", "ru"]`, `defaultLocale: "sr-Latn"`, and default/unprefixed routing. This officially supports static localized routes and matches the desired URL model:

- `/` for Serbian Latin
- `/en/` for English
- `/ru/` for Russian

Alternative considered: `prefixDefaultLocale: true` with `/sr-Latn/`. This is officially supported, but it leaves `/` as a separate page or redirect and adds an unnecessary URL for the primary audience.

Alternative considered: manual `[locale]` routing without Astro i18n. This is simple, but built-in i18n gives route helpers, `Astro.currentLocale`, and framework-supported URL validation without requiring server output.

### Render localized pages from one shared landing template

The current page is monolithic. The implementation should extract reusable rendering into a shared landing page component or layout and pass locale-specific content from a typed dictionary. The default `src/pages/index.astro` and localized `src/pages/en/index.astro` / `src/pages/ru/index.astro` pages should use the same template to keep structure and styling consistent.

Alternative considered: copy the current `index.astro` into each locale folder and translate inline. This is fast initially but makes visual, SEO, and legal/security updates error-prone across three pages.

### Keep language selection explicit

Add a visible language switcher with links to `/`, `/en/`, and `/ru/`. Because the site remains static, the switcher should not rely on request-time detection or server middleware.

Alternative considered: client-side language detection using `navigator.language` on `/`. This could surprise visitors, complicate SEO for the root URL, and conflicts with the desired Serbian Latin default root page.

### Localize SEO and accessibility alongside visible copy

Each locale needs localized title, description, navigation labels, button text, FAQ content, footer copy, aria labels, and alternate-language metadata. Canonical URLs should point to the locale's own page, and `hreflang` alternates should include `sr-Latn`, `en`, `ru`, and optionally `x-default` pointing to `/`.

## Risks / Trade-offs

- Translation accuracy risk → Keep Serbian legal/tax/security nuance as the source of truth and review English/Russian copy for meaning rather than literal phrasing.
- Monolithic refactor risk → Preserve current CSS and theme script behavior while extracting content and structure incrementally.
- SEO duplication risk → Do not create `/sr-Latn/`; use `/` as the canonical Serbian Latin page and point alternates accordingly.
- Astro i18n expectation risk → Avoid features that require on-demand rendering, such as `Astro.preferredLocale`-based redirects.

## Migration Plan

1. Add Astro i18n config for `sr-Latn`, `en`, and `ru` with Serbian Latin as the unprefixed default locale.
2. Extract the landing page into shared content data plus a reusable Astro template/layout while preserving the current root page behavior.
3. Add English and Russian localized route pages that render the shared template with localized content.
4. Add language switcher and locale-aware SEO metadata.
5. Run the website build checks.

Rollback is straightforward: remove the i18n config, localized route pages, and shared localization data/template, then restore the single `src/pages/index.astro` implementation.

## Open Questions

- Who should review the English and Russian translations before launch?
- Should `x-default` point to `/` only, or should the site omit `x-default` because `/` is a real Serbian Latin page rather than a language selector?

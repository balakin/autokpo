## Context

`apps/website` is a static Astro site with localized landing routes for Serbian Latin, English, and Russian. The landing page currently owns the full document shell, theme setup, localized metadata, language switcher, and footer. There is no existing Markdown content pipeline beyond Astro's built-in Markdown support.

The requested legal documents are templates, not final legal text. The current iteration should create the structure, routing, rendering, and navigation affordances while using localized lorem ipsum content.

## Goals / Non-Goals

**Goals:**

- Add Cookies Policy, Privacy Policy, and Terms of Service pages to `apps/website` for all supported locales.
- Use English URL slugs for every locale: `privacy`, `terms`, and `cookies`.
- Render document bodies from Markdown at build time.
- Keep legal pages visually consistent with the existing website theme, typography, favicon setup, and light/dark behavior.
- Add convenient localized footer links to the three legal documents.

**Non-Goals:**

- Write final legal copy or assert legal correctness.
- Change the authenticated app, worker, database, API, or deployment model.
- Add a client-side Markdown renderer or runtime Markdown parsing dependency.
- Add new website locales.

## Decisions

### Use Astro Markdown pages with a shared legal document layout

Legal documents will be authored as `.md` files under `src/pages` and wrapped by a shared `legal-document-layout.astro` via Markdown frontmatter. The legal layout delegates the HTML shell to a common `base-layout.astro` and imports shared `site-header.astro` and `site-footer.astro` components.

Rationale: Astro already renders Markdown at build time, which keeps document content crawlable, avoids extra JavaScript, and makes future legal copy easy to edit. Extracting shared shell components from the landing page (see "Extract shared website shell" below) keeps the legal layout thin and prevents drift between landing and legal page chrome.

Alternative considered: embed Markdown as strings and parse in the browser. This would add unnecessary client JavaScript, weaker SEO, and more maintenance risk.

### Keep English slugs across locales

Routes will use stable English slugs for each document:

- Serbian Latin default locale: `/privacy/`, `/terms/`, `/cookies/`
- English: `/en/privacy/`, `/en/terms/`, `/en/cookies/`
- Russian: `/ru/privacy/`, `/ru/terms/`, `/ru/cookies/`

Rationale: This avoids localized slug drift, keeps links short and predictable, and matches the user's explicit preference.

Alternative considered: localized slugs. This could be friendlier per locale, but introduces transliteration decisions and makes cross-locale link management noisier.

### Centralize legal labels, routes, and UI strings

Localized legal document metadata (titles, descriptions, slugs, updated dates), UI strings (updated prefix, theme labels, footer tagline), and locale lists live in `src/i18n/legal.ts` as a typed `LegalLocaleContent` structure. Landing-page-specific copy remains in `src/i18n/landing.ts`, which was refactored to expose only landing-relevant strings and reference legal links externally.

Rationale: The footer and legal layout both need the same route/label/UI information. Keeping legal-specific data in a dedicated i18n module avoids mismatched links and duplicated strings between landing and legal pages.

Alternative considered: hard-code links in each page/layout. This is faster initially but increases duplication across nine Markdown documents and both layout footprints.

### Extract shared website shell from the landing page

The existing landing page contained the full document shell (HTML head, meta tags, CSS variables, font loading, theme toggle). This shell was extracted into three shared components so both landing and legal pages reuse a single source of truth:

- `base-layout.astro` — HTML document shell, charset/viewport meta, title/description, favicon links, `@font-face` declarations, CSS custom properties, reset styles, skip-link, and theme toggle script.
- `site-header.astro` — Wordmark link, navigation, language switcher, and theme toggle button.
- `site-footer.astro` — Brand wordmark, tagline, GitHub link, AGPL-3.0 license badge, and legal document links.

The landing page was also renamed from `LandingPage.astro` to `landing-page.astro` for consistency with the kebab-case naming used across the website package.

Rationale: Without extraction, the legal layout would need to duplicate the full HTML shell, fonts, theme variables, and toggle behavior — creating immediate drift risk. The landing page already had production-quality theme/l10n/a11y concerns; extracting them into reusable components keeps the site coherent and makes future page types trivially consistent.

Alternative considered: copy the shell into the legal layout. This is faster for the first legal page but guarantees style drift and makes every future website page type harder to add.

### Reuse the website visual language, not the standalone HTML files

The supplied HTML documents are visual/content references only. The implementation should adapt their useful document readability patterns into the Astro website style rather than copying standalone HTML files.

Rationale: The website already has local fonts, theme variables, favicons, and footer structure. A shared Astro layout keeps the public site coherent.

## Risks / Trade-offs

- Placeholder copy may be mistaken for final policy text → Use clearly generic lorem ipsum and avoid legal-specific claims beyond document titles until final copy is provided.
- ~~Duplicating shell styles between landing and legal layouts could drift~~ → Resolved by extracting `base-layout.astro`, `site-header.astro`, and `site-footer.astro` as shared components. Both landing and legal pages now reuse the same HTML shell, fonts, theme variables, and toggle behavior.
- Markdown layout paths differ between root and nested locale folders → Root-level pages use `../../layouts/` and nested locale pages use `../../../layouts/`. Keep file structure predictable and verify the production build generates all routes.
- Footer links could become crowded on small screens → Use existing wrapping footer layout and validate responsive behavior.

## Migration Plan

This is additive. Deploy static pages and footer links with the normal website build. Rollback is removing the legal Markdown pages/layout updates and reverting footer links.

## Open Questions

- ~~Should legal pages include a language switcher between equivalent documents, or is footer/header navigation enough for the first iteration?~~ → The shared `site-header.astro` includes a language switcher that renders on both landing and legal pages. Each legal page passes a full `alternates` array with locale-specific routes, so visitors can switch between equivalent documents directly from the header.
- ~~Should final legal content eventually live in Markdown pages only, or should metadata and document registry be formalized further as a content collection?~~ → For the first iteration, document bodies live in Markdown pages and metadata (titles, descriptions, slugs, updated dates) is centralized in `src/i18n/legal.ts`. A future iteration may migrate to an Astro content collection if richer per-document metadata or programmatic queries become necessary.

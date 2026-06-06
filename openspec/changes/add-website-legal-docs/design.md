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

### Use Astro Markdown pages with a shared legal layout

Legal documents will be authored as `.md` files under `src/pages` and wrapped by a shared `LegalDocumentLayout.astro` via Markdown frontmatter.

Rationale: Astro already renders Markdown at build time, which keeps document content crawlable, avoids extra JavaScript, and makes future legal copy easy to edit.

Alternative considered: embed Markdown as strings and parse in the browser. This matches the HTML references, but it adds unnecessary client JavaScript, weaker SEO, and more maintenance risk.

### Keep English slugs across locales

Routes will use stable English slugs for each document:

- Serbian Latin default locale: `/privacy/`, `/terms/`, `/cookies/`
- English: `/en/privacy/`, `/en/terms/`, `/en/cookies/`
- Russian: `/ru/privacy/`, `/ru/terms/`, `/ru/cookies/`

Rationale: This avoids localized slug drift, keeps links short and predictable, and matches the user's explicit preference.

Alternative considered: localized slugs. This could be friendlier per locale, but introduces transliteration decisions and makes cross-locale link management noisier.

### Centralize legal labels and routes

Localized legal document labels, route paths, and footer link data should live in website i18n data, likely separate from landing-specific copy.

Rationale: The footer and legal layout both need the same route/label information. Keeping it centralized avoids mismatched links between landing and legal pages.

Alternative considered: hard-code links in each page/layout. This is faster initially but increases duplication across nine Markdown documents and the landing footer.

### Reuse the website visual language, not the standalone HTML files

The supplied HTML documents are visual/content references only. The implementation should adapt their useful document readability patterns into the Astro website style rather than copying standalone HTML files.

Rationale: The website already has local fonts, theme variables, favicons, and footer structure. A shared Astro layout keeps the public site coherent.

## Risks / Trade-offs

- Placeholder copy may be mistaken for final policy text → Use clearly generic lorem ipsum and avoid legal-specific claims beyond document titles until final copy is provided.
- Duplicating shell styles between landing and legal layouts could drift → Prefer extracting or reusing common shell/footer/theme pieces if implementation remains simple; otherwise keep the first iteration scoped and revisit shared layout extraction later.
- Markdown layout paths differ between root and nested locale folders → Keep file structure predictable and verify the production build generates all routes.
- Footer links could become crowded on small screens → Use existing wrapping footer layout and validate responsive behavior.

## Migration Plan

This is additive. Deploy static pages and footer links with the normal website build. Rollback is removing the legal Markdown pages/layout updates and reverting footer links.

## Open Questions

- Should legal pages include a language switcher between equivalent documents, or is footer/header navigation enough for the first iteration?
- Should final legal content eventually live in Markdown pages only, or should metadata and document registry be formalized further as a content collection?

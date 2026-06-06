## 1. Legal content structure

- [x] 1.1 Add centralized website legal document route and label data for Serbian Latin, English, and Russian using English slugs.
- [x] 1.2 Add Markdown legal document pages for Privacy Policy, Terms of Service, and Cookies Policy in the Serbian Latin default locale.
- [x] 1.3 Add Markdown legal document pages for Privacy Policy, Terms of Service, and Cookies Policy in the English locale.
- [x] 1.4 Add Markdown legal document pages for Privacy Policy, Terms of Service, and Cookies Policy in the Russian locale.
- [x] 1.5 Populate each legal Markdown page with localized lorem ipsum placeholder content and document frontmatter.

## 2. Legal page layout

- [x] 2.1 Create a shared Astro legal document layout that renders Markdown content with localized title, description, updated metadata, canonical URL, and document language.
- [x] 2.2 Add website-aligned legal document styles for headings, paragraphs, lists, links, tables, blockquotes, code blocks, and responsive spacing.
- [x] 2.3 Include existing website favicon links, local font loading, theme variables, and light/dark theme toggle behavior in the legal layout.
- [x] 2.4 Add footer links on legal pages for GitHub, Privacy Policy, Terms of Service, Cookies Policy, and AGPL-3.0.

## 3. Landing footer integration

- [x] 3.1 Update landing page i18n data to expose localized labels/routes for legal footer links.
- [x] 3.2 Update the existing landing footer to render links to the locale-matching Privacy Policy, Terms of Service, and Cookies Policy pages.
- [x] 3.3 Verify footer layout wraps cleanly on narrow screens with the additional links.

## 4. Validation

- [x] 4.1 Run the website build from `apps/website` and confirm Astro check/build succeeds.
- [x] 4.2 Verify static routes exist for `/privacy/`, `/terms/`, `/cookies/`, `/en/privacy/`, `/en/terms/`, `/en/cookies/`, `/ru/privacy/`, `/ru/terms/`, and `/ru/cookies/`.
- [x] 4.3 Verify generated legal pages do not use a browser-side Markdown renderer or new runtime Markdown parser dependency.

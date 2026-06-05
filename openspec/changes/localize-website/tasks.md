## 1. Astro i18n Setup

- [ ] 1.1 Configure `apps/website/astro.config.ts` with locales `sr-Latn`, `en`, and `ru`, using `sr-Latn` as the default unprefixed locale.
- [ ] 1.2 Confirm the website remains static and does not require `output: "server"`, a server adapter, or middleware-based language detection.

## 2. Shared Landing Structure

- [ ] 2.1 Extract the current landing page structure into a reusable Astro landing template/layout while preserving existing styles, assets, theme bootstrap script, and theme toggle behavior.
- [ ] 2.2 Create typed locale/content data for Serbian Latin, English, and Russian landing copy, including metadata, nav labels, hero copy, feature content, security copy, FAQ entries, CTA labels, footer text, and accessibility labels.
- [ ] 2.3 Update the root `src/pages/index.astro` page to render the shared landing template with Serbian Latin content.

## 3. Localized Routes

- [ ] 3.1 Add `src/pages/en/index.astro` to render the shared landing template with English content.
- [ ] 3.2 Add `src/pages/ru/index.astro` to render the shared landing template with Russian content.
- [ ] 3.3 Verify `/` renders Serbian Latin, `/en/` renders English, and `/ru/` renders Russian.

## 4. Language Switching and SEO

- [ ] 4.1 Add a visible accessible language switcher linking Serbian Latin to `/`, English to `/en/`, and Russian to `/ru/`.
- [ ] 4.2 Render locale-specific `html lang`, title, description, canonical URL, and `hreflang` alternate links for each locale.
- [ ] 4.3 Ensure root `/` does not auto-detect browser language or redirect away from Serbian Latin content.

## 5. Verification

- [ ] 5.1 Run `pnpm -s build` in `apps/website` and resolve any Astro check or build errors.
- [ ] 5.2 Inspect the generated static output to confirm `/`, `/en/`, and `/ru/` pages are emitted.
- [ ] 5.3 Review localized pages for preserved CTA targets, GitHub links, legal disclaimer, security claims, AGPL/project metadata, and theme behavior.

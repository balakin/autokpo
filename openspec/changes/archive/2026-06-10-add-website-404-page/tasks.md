## 1. Wrangler Setup

- [x] 1.1 Add `wrangler` as a dev dependency in `apps/website/package.json`
- [x] 1.2 Create `apps/website/wrangler.jsonc` with `name: "autokpo-website"`, `assets.directory: "./dist"`, `assets.not_found_handling: "404-page"`, and today's `compatibility_date`

## 2. 404 Page

- [x] 2.1 Create `apps/website/src/pages/404.astro` using `base-layout.astro` with sr-Latn copy for title, description, heading, and message
- [x] 2.2 Add navigation links on the 404 page to `/` (Srpski), `/en/` (English), and `/ru/` (Русский)

## 3. Verification

- [x] 3.1 Run `astro build` in `apps/website` and confirm `dist/404.html` is present in the output

## 1. Install dependency

- [x] 1.1 Add `@astrojs/sitemap` to `apps/website/package.json` devDependencies and install

## 2. Configure sitemap integration

- [x] 2.1 Import and register `@astrojs/sitemap` in `apps/website/astro.config.ts`
- [x] 2.2 Add a `filter` option to exclude the `/404` page from the sitemap

## 3. Add robots.txt

- [x] 3.1 Create `apps/website/public/robots.txt` with `User-agent: *`, `Allow: /`, and `Sitemap: https://autokpo.com/sitemap-index.xml`

## 4. Verify build output

- [x] 4.1 Run `cd apps/website && pnpm -s build` and confirm `dist/sitemap-index.xml`, `dist/sitemap-0.xml`, and `dist/robots.txt` are present
- [x] 4.2 Inspect `dist/sitemap-0.xml` and confirm all 9 indexable pages are listed with `xhtml:link` alternate entries
- [x] 4.3 Confirm `/404` is absent from the sitemap

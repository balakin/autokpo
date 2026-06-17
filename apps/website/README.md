# @autokpo/website

[![Website deployment](https://img.shields.io/github/deployments/balakin/autokpo/Website?label=deployment&logo=cloudflare&logoColor=white&style=flat-square)](https://autokpo.com)
![Astro](https://img.shields.io/badge/Astro-bc52ee?logo=astro&logoColor=white&style=flat-square)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflareworkers&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white&style=flat-square)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square)](../../LICENSE)

Public marketing site for AutoKPO — an Astro static site deployed to Cloudflare Workers (static assets).

## What it is

The landing page and legal documents (privacy policy, terms of service) served at [autokpo.com](https://autokpo.com). It is a fully static, content-only site — no app state, no D1, no sync. Content lives in `src/` (pages, layouts, components, and locale-keyed copy under `i18n/`), with static fonts and images in `public/`. Pages are localized into three locales (`sr-Latn`, `en`, `ru`) using Astro's built-in i18n routing, with `en` as the default.

Most of the interesting behavior is in [`astro.config.ts`](astro.config.ts) — site/i18n/sitemap config plus the build integration that emits the strict CSP `_headers` file and the per-build version stamp. Those are covered in [Content Security Policy](#content-security-policy) and [Build versioning](#build-versioning) below.

## Prerequisites

- Node 24

## Local setup

```bash
# from the repo root
pnpm install

# optional: enable analytics locally
cp .env.example .env   # fill in PUBLIC_POSTHOG_* if desired

# start the dev server (http://localhost:4321)
pnpm dev
```

### Environment variables

`PUBLIC_*` vars are inlined into the static bundle at **build time** and are safe to expose to the browser.

| Variable                       | Required | Purpose                           |
| ------------------------------ | -------- | --------------------------------- |
| `PUBLIC_POSTHOG_PROJECT_TOKEN` | no       | PostHog project token (analytics) |
| `PUBLIC_POSTHOG_HOST`          | no       | PostHog ingestion host            |

See [`.env.example`](.env.example) for the local-development template.

## Commands

```bash
pnpm dev       # start the Astro dev server at localhost:4321
pnpm build     # astro check (typecheck) + astro build → ./dist
pnpm preview   # preview the production build locally
pnpm astro     # run Astro CLI commands (e.g. astro add, astro check)
pnpm deploy    # wrangler deploy (production); normally run by CI, not by hand
```

## Content Security Policy

The site ships a strict, hash-based CSP generated at build time by the `generate-headers` integration in [`astro.config.ts`](astro.config.ts). After `astro build`, it parses every emitted HTML file, computes SHA-256 hashes of all inline `<script>` and `<style>` tags, and writes a `dist/_headers` file with `default-src 'none'` plus per-hash `script-src` / `style-src` allowlists (no `unsafe-inline`, no nonce). `connect-src` is widened only to the configured `PUBLIC_POSTHOG_HOST`. The same file also sets `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`.

Because the policy is hash-based with no `unsafe-inline` and no nonce, Cloudflare's free-tier JavaScript Detections (JSD) beacon is intentionally blocked — do not loosen the policy to accommodate it.

## Build versioning

Each build inlines a unique `PUBLIC_BUILD_VERSION` (`<version>+<shortSha>.<utcTimestamp>`) so every deploy produces distinct HTML. Cloudflare Workers Assets only ships changed files, so a rotating value ensures an otherwise-unchanged build is still accepted.

## Deployment

Deployment is automated. When a Release PR merges to `main`, the **Release** workflow (`.github/workflows/release.yml`) publishes the changesets and then — only if `@autokpo/website` was among the published packages — calls the **Deploy Website** workflow (`.github/workflows/deploy-website.yml`) as a reusable workflow (`workflow_call`, `secrets: inherit`). It is **not** triggered by the release tag: tags pushed with `GITHUB_TOKEN` don't fire `push`/`create` events, so the reusable-workflow call is what kicks off the deploy, at the same commit the tag points to. You can also run it manually via `workflow_dispatch`.

The workflow is split into two jobs for least privilege:

1. **Build** — checks out, installs cleanly (no restored cache), builds the static site with the `PUBLIC_*` build vars, and uploads `dist/` + `wrangler.jsonc` as an artifact. Holds **no** Cloudflare credentials, since it runs untrusted dependency code.
2. **Deploy** — no checkout; downloads the build artifact and ships it with the pinned `cloudflare/wrangler-action` (installs only `wrangler`, no `pnpm install`) running `wrangler deploy` (no D1, no migrations — the site is assets-only). It runs in the `Website` GitHub Environment (`https://autokpo.com`) and authenticates with `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`.

The workflow sets no `CLOUDFLARE_ENV`, so Wrangler uses this package's single default config. This is intentional: the website has no `env.production` section, so it must **not** receive a `production` environment value (the app's separate workflow is the only one that sets `CLOUDFLARE_ENV`). The client-side build variables (`PUBLIC_*` above) are read in the build job from GitHub Actions **variables** (`vars`) and listed in `turbo.json`'s `build.env` so Turbo's strict mode passes them through.

## License

[GNU Affero General Public License v3.0](../../LICENSE) (AGPL-3.0).

Guidance for AI coding agents working in `apps/website/` (`@autokpo/website`).

> Root guidance (monorepo layout, commands, token-efficiency principles) is in the repository root `AGENTS.md`.

## What this project is

Public marketing site for AutoKPO — a fully static Astro site (landing page + legal documents) served at [autokpo.com](https://autokpo.com) and deployed to Cloudflare Workers as static assets. There is **no Worker code, no D1, no sync** — it is content only. Pages are localized into three locales (`sr-Latn`, `en`, `ru`) via Astro's built-in i18n routing, with `en` as the default. Content lives in `src/` (pages, layouts, components, and locale-keyed copy in `src/i18n/`); fonts and images are in `public/`. See [`README.md`](README.md) for setup, env vars, and deployment.

## Commands

Run via `cd apps/website && pnpm -s <script>`.

```bash
dev       # astro dev (http://localhost:4321)
build     # astro check (typecheck) + astro build → dist/
preview   # preview the production build
```

For linting, run **ESLint from inside the package** (its flat config extends `@autokpo/eslint-config` plus `eslint-plugin-astro`) and **Prettier from the repo root** — per root guidance. There are no unit tests; `astro check` (part of `build`) is the typecheck gate. `deploy` is CI-only — do not run it.

## Key conventions

- **i18n**: all user-facing copy is centralized in `src/i18n/` (`landing.ts`, `legal.ts`), keyed by the `Locale` union (`'sr-Latn' | 'en' | 'ru'`). Add a new string to every locale; never hardcode copy in `.astro` components. Routing uses Astro's `getRelativeLocaleUrl` / i18n config in [`astro.config.ts`](astro.config.ts).
- **Icons**: Lucide via `@lucide/astro` only (the landing content maps an `IconName` union to components). No ad-hoc SVGs, no `react-icons` (that's the app's stack, not this one).
- **CSP / `_headers`**: a strict, hash-based Content Security Policy is generated at build time by the `generate-headers` integration in [`astro.config.ts`](astro.config.ts) and written to `dist/_headers`. Do **not** loosen it with `unsafe-inline` or a nonce — it is hash-only by design and intentionally blocks Cloudflare's free-tier JSD beacon. See [`README.md`](README.md#content-security-policy). Inline `<script>`/`<style>` you add will be hashed automatically; external origins must be added to the narrowest CSP directive.
- **Build versioning**: each build inlines a unique `PUBLIC_BUILD_VERSION` (`<version>+<sha>.<timestamp>`) so every deploy produces distinct HTML — Cloudflare Workers Assets only ships changed files, so an otherwise-identical build would be rejected.
- **Astro / library docs**: before writing non-trivial Astro (or other third-party) code, consult the docs via the `astro-docs` / Context7 MCP tools rather than relying on memory.

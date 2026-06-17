<div align="center">

<img src="apps/app/public/favicon.svg" alt="AutoKPO" width="96" height="96" />

# AutoKPO

**KPO record-keeping for flat-rate entrepreneurs in Serbia.**

[**Open the app**](https://app.autokpo.com) &nbsp;·&nbsp; [**Website**](https://autokpo.com)

[![Application deployment](https://img.shields.io/github/deployments/balakin/autokpo/Application?label=app&logo=cloudflare&logoColor=white&style=flat-square)](https://app.autokpo.com)
[![Website deployment](https://img.shields.io/github/deployments/balakin/autokpo/Website?label=website&logo=cloudflare&logoColor=white&style=flat-square)](https://autokpo.com)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square)](LICENSE)

</div>

## What it does

AutoKPO helps flat-rate entrepreneurs in Serbia maintain yearly KPO books, record income, track limits, and export PDFs. Application data lives on-device first (IndexedDB via Yjs) and syncs across devices through a Cloudflare Worker backed by a D1 database.

Key features:

- Local-first — works offline, no data loss on network failure
- Cross-device sync via Cloudflare Worker + D1
- PDF export of the KPO ledger
- Income statistics and charts
- Multi-language UI (Serbian, English, Russian)
- PWA — installable on desktop and mobile

## Repository layout

```
apps/
  app/      — @autokpo/app      (React PWA + Cloudflare Worker)
  website/  — @autokpo/website  (Astro public website)
packages/
  eslint-config/ — @autokpo/eslint-config  (shared ESLint preset)
openspec/
  specs/  — feature specs and architecture decisions
```

## Prerequisites

- Node 24

## Getting started

```bash
corepack enable
pnpm install
```

Each app has its own environment files and setup steps (env vars, local D1 database, migrations). Follow the per-package README before running it:

- **[`apps/app`](apps/app/README.md)** — `@autokpo/app` (the PWA + Worker; requires `.env`, `.dev.vars`, and a local D1 migration)
- **[`apps/website`](apps/website/README.md)** — `@autokpo/website` (the public site)

Once a package is configured, `pnpm dev` from the repo root runs every app via Turborepo.

## Releases

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation. Releases are published as GitHub Releases (not npm).

**Adding a changeset to your PR:**

```bash
pnpm changeset
# follow the prompts: select bump type (patch/minor/major) and write a summary
# commit the generated .changeset/*.md file with your PR
```

**Release flow:**

1. PRs with changesets land on `main` → CI automatically creates or updates a "Release PR" (`chore: release packages`)
2. When you're ready to release, review and merge the Release PR
3. CI tags the new version and creates a GitHub Release

See the [Changesets documentation](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md) for a full guide.

## License

[GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0). If you run a modified version of this software over a network, you must make the corresponding source code available to users.

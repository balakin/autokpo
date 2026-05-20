# AutoKPO

A local-first web app for generating the Serbian tax **Knjiga o ostvarenom prometu** (KPO — Book of Achieved Turnover).

## What it does

AutoKPO helps Serbian entrepreneurs under the flat-rate taxation regime (paušalno oporezivanje) maintain their KPO ledger and export it as a PDF. All data lives on-device first (IndexedDB via Yjs) and syncs across devices through a Cloudflare Worker backed by a D1 database.

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
  app/    — @autokpo/app  (React PWA + Cloudflare Worker)
openspec/
  specs/  — feature specs and architecture decisions
```

## Prerequisites

- Node 24

## Getting started

```bash
corepack enable
pnpm install
cp apps/app/.env.example apps/app/.env
cp apps/app/.dev.vars.example apps/app/.dev.vars
# fill in the required values, then:
pnpm dev
```

## License

[GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0). If you run a modified version of this software over a network, you must make the corresponding source code available to users.

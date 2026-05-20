## Why

The project has no automated release process — versions are hardcoded and there is no mechanism to produce GitHub Releases or changelogs. Changesets provides a structured, developer-friendly release workflow that fits a monorepo and targets GitHub Releases (not npm) for a private app.

## What Changes

- Install `@changesets/cli` and `@changesets/changelog-github` as root `devDependencies`
- Add `.changeset/config.json` for GitHub-only, independent, private-package releases
- Add `release.yml` GitHub Actions workflow that creates a Release Pull Request or publishes (tags) on merge to `main`
- Update `.github/actions/setup/action.yml` to accept a `cache` boolean input so the release job can opt out of the pnpm store cache (cache poisoning mitigation)
- Inject `apps/app/package.json` version into the app at build time via `vite.config.ts` `define`, replacing the hardcoded `v0.0.0-dev` badge in the sidebar
- Update the version badge test to use the injected `__APP_VERSION__` define
- Reset `apps/app/package.json` version from `0.0.0-dev` to `0.0.0` so Changesets owns the version from this point forward
- Add a Changesets usage section to the root `README.md`

## Capabilities

### New Capabilities

- `release-management`: Changesets-based release workflow — versioning, changelog generation (GitHub format), Release PR creation, and GitHub Release tagging via CI

### Modified Capabilities

- `app-shell`: Version badge now shows the real app version injected at build time, not a hardcoded string

## Impact

- **New deps**: `@changesets/cli`, `@changesets/changelog-github` in root `devDependencies`
- **New file**: `.changeset/config.json`
- **New file**: `.github/workflows/release.yml`
- **Modified**: `.github/actions/setup/action.yml` — new `cache` input
- **Modified**: `apps/app/package.json` — version `0.0.0-dev` → `0.0.0`
- **Modified**: `apps/app/vite.config.ts` — `define.__APP_VERSION__`
- **Modified**: `apps/app/src/app-shell/sidebar.tsx` — reads `__APP_VERSION__`
- **Modified**: `apps/app/src/app-shell/__tests__/app-shell.spec.tsx` — mocks `__APP_VERSION__`
- **Modified**: `README.md` — Changesets usage docs
- **No npm publish** — `access: restricted` and `pnpm changeset tag` as publish command keep everything on GitHub only

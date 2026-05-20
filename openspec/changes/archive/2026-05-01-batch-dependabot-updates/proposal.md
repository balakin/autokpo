## Why

Dependabot currently creates a separate pull request for every dependency update, leading to PR noise and fragmented review overhead. With ~60 dependencies across the monorepo root and `apps/app`, a single weekly scan can generate five or more individual bump PRs. Grouping updates into batched PRs reduces noise while keeping updates timely and reviewable.

## What Changes

- Update `.github/dependabot.yml` to batch dependency updates into three groups:
  - **prod-dependencies** — minor and patch updates for production dependencies
  - **dev-dependencies** — minor and patch updates for development dependencies
  - **major-updates** — all major version updates (both prod and dev)
- Scan the workspace root (`/`) — Dependabot discovers all workspace packages via `pnpm-workspace.yaml`
- No change to `minimumReleaseAge: 2880` in `pnpm-workspace.yaml` — 48-hour cooling-off period remains in place

## Capabilities

### New Capabilities

<!-- This change is repo infrastructure; no product capabilities are introduced. -->

- _None_

### Modified Capabilities

<!-- No existing spec-level requirements change. -->

- _None_

## Impact

- `.github/dependabot.yml` — configuration updated
- CI behavior — Dependabot PRs will now be grouped; some PRs may be red for up to 48 hours until `minimumReleaseAge` is satisfied
- No application code, API, or dependency changes

## Why

Every dependabot run fails with `ERR_PNPM_MISSING_TIME` because pnpm 11.0.6's `time-based` resolution mode fetches fresh npm metadata for `es-toolkit` (a transitive dep of `recharts`) in dependabot's cache-less environment, and that metadata is missing the required `time` field. This bug is fixed in pnpm 11.1.2. Additionally, the `major-updates` dependabot group has never matched any dependencies due to specificity rules, producing a warning every run and dead config.

## What Changes

- Bump `packageManager` field in root `package.json` from `pnpm@11.0.6` to `pnpm@11.1.2`
- Remove the `major-updates` group from `.github/dependabot.yml` (dead config — no deps ever matched it; major updates already fall through to individual PRs)

## Capabilities

### New Capabilities

_None — this is a tooling fix, no product capabilities introduced._

### Modified Capabilities

_None — no spec-level behavior changes._

## Impact

- `package.json` — `packageManager` field only
- `.github/dependabot.yml` — group config only
- Dependabot will start producing PRs again (minor/patch grouped by dep type; majors as individual PRs)
- Local dev unaffected — pnpm 11.1.2 is within the `>=11 <12` engines constraint

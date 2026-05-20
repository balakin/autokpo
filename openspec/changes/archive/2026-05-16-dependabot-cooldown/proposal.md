## Why

`pnpm-workspace.yaml` enforces a 2-day minimum package age (`minimumReleaseAge: 2880`) at install time, but Dependabot has no matching cooldown — it can open PRs for packages released minutes ago, creating a window where a bad actor package could land in review before pnpm's guard kicks in. Aligning Dependabot's cooldown to the same 2-day window closes that gap at the PR-creation layer.

## What Changes

- Add `cooldown: default-days: 2` to the `npm` update entry in `.github/dependabot.yml`

## Capabilities

### New Capabilities

- `dependabot-cooldown`: Dependabot version-update PRs for npm packages are delayed until the package version is at least 2 days old, matching pnpm's `minimumReleaseAge: 2880`.

### Modified Capabilities

- `dependabot-grouping`: Cooldown is additive to existing grouping — no grouping behavior changes, but PRs may be delayed relative to current timing.

## Impact

- `.github/dependabot.yml` — one field added
- No code changes, no build changes
- Dependabot PRs will open slightly later than before for freshly-released packages; no impact on security updates (security updates bypass cooldown)

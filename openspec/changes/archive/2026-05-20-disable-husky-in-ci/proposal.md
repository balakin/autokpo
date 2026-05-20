## Why

Husky is a local development tool for git hooks. When `pnpm install` runs in CI it triggers the `prepare` lifecycle script which installs Husky hooks into `.git/hooks/`. This causes hooks to fire during CI git operations (e.g. `changesets/action` commits), running expensive local checks (build, tests, lint-staged) in contexts where they serve no purpose and can break release tooling.

## What Changes

- Set `HUSKY=0` environment variable in the shared setup action (`.github/actions/setup/action.yml`) so Husky skips hook installation during `pnpm install` in all CI workflows.

## Capabilities

### New Capabilities

- `ci-husky-disabled`: Husky git hooks are disabled in all CI/CD environments by setting `HUSKY=0` in the shared setup action.

### Modified Capabilities

## Impact

- `.github/actions/setup/action.yml` — single file change
- Affects both `ci-cd.yml` and `release.yml` (both use the shared setup action)
- No impact on local development; hooks continue to work normally for developers

## Why

Dependabot dependency PRs can fail CI when a Wrangler or Cloudflare-related update changes the generated Worker environment types. Manually pushing regenerated types to a Dependabot PR adds an extra commit, which makes Dependabot stop rebasing unless the commit explicitly opts into Dependabot overwrites.

## What Changes

- Add an automated GitHub Actions workflow for Dependabot npm pull requests that regenerates `apps/app/worker-configuration.d.ts` using the existing app worker-types script.
- Commit regenerated worker types back to the Dependabot branch only when the generated file changes.
- Use a commit message containing `[dependabot skip]` so Dependabot may continue rebasing or recreating its PRs over the generated-file commit.
- Keep Dependabot as the dependency update system; do not migrate to Renovate.
- Preserve the existing verification workflow, including `pnpm check:worker-types`.
- Restrict the fixer workflow permissions to the minimum needed for same-repository Dependabot PRs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `dependabot-pnpm`: Dependabot npm PRs should be automatically repaired when worker type generation is required after dependency updates.

## Impact

- Adds a GitHub Actions workflow under `.github/workflows/`.
- May update `.github/dependabot.yml` to make security-update grouping explicit while preserving current weekly grouped version update behavior.
- Uses existing scripts: root `generate:worker-types` and app `generate:worker-types` / `check:worker-types`.
- Affects `apps/app/worker-configuration.d.ts` only when generated output changes.
- Does not add application runtime code or dependencies.

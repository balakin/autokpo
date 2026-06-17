## Context

The repository currently uses Dependabot for npm and GitHub Actions updates. The app tracks generated Cloudflare Worker environment types in `apps/app/worker-configuration.d.ts`; CI verifies this file with `pnpm check:worker-types` before lint, tests, and build.

Dependency updates can change Wrangler's generated type output. When that happens, Dependabot opens a valid dependency PR but CI fails until `pnpm generate:worker-types` is run and the generated file is committed. Manually or automatically adding a normal extra commit to a Dependabot branch causes Dependabot to stop rebasing that PR. GitHub documents that extra commits containing `[dependabot skip]` allow Dependabot to force-push over them and continue managing the PR.

## Goals / Non-Goals

**Goals:**

- Keep Dependabot as the dependency update system.
- Automatically regenerate Worker types for Dependabot npm PRs.
- Commit generated type changes with a `[dependabot skip]` marker so Dependabot can continue rebasing or recreating its PRs.
- Restrict the fixer workflow to same-repository Dependabot PRs and minimum permissions.
- Preserve existing CI as the source of truth for worker type freshness.

**Non-Goals:**

- Do not migrate to Renovate.
- Do not add `postinstall` or other install-time generation hooks.
- Do not grant deploy, secrets, package, issue, or broad pull-request write permissions to the fixer workflow.
- Do not alter application runtime behavior.

## Decisions

### Use a dedicated Dependabot fixer workflow

Add a GitHub Actions workflow that runs on Dependabot pull requests, installs dependencies, runs worker type generation, and commits only `apps/app/worker-configuration.d.ts` when it changes.

Alternative considered: use `postinstall`. This was rejected because it makes every local and CI install generate tracked files, can dirty developer worktrees, can fail unrelated installs, and is not documented as a reliable way to make Dependabot commit generated artifacts.

Alternative considered: migrate to Renovate. Hosted Renovate does not solve command execution for generated files, while self-hosted Renovate adds operational surface. The requested direction is to keep Dependabot.

### Gate the workflow tightly

The workflow should only proceed when all of these are true:

- The event is a pull request.
- The PR author is `dependabot[bot]`.
- The PR branch repository is the same repository as the base repository.
- The PR corresponds to the npm ecosystem, either by workflow path filtering or by Dependabot metadata.

This avoids running a write-capable workflow for fork PRs or human-authored branches.

### Use minimal permissions

The workflow should deny permissions by default and grant only what it needs:

- `contents: write` to push a generated-file commit to the Dependabot branch.
- `pull-requests: read` if PR metadata or Dependabot metadata is needed.

It should not use repository secrets, Cloudflare credentials, deploy permissions, or broad `write-all` permissions.

### Preserve Dependabot ownership with `[dependabot skip]`

The generated-file commit message should include `[dependabot skip]`, for example:

```text
chore: regenerate worker types [dependabot skip]
```

This marker tells Dependabot it may force-push over the extra commit when rebasing or recreating the PR. If Dependabot overwrites the generated commit, the fixer workflow can run again and restore the generated file.

### Keep CI verification unchanged

The existing `verify` workflow should continue to run `pnpm check:worker-types`. The fixer workflow improves Dependabot PRs, but CI remains the enforcement point that generated worker types match `wrangler.jsonc` and the resolved Wrangler version.

## Risks / Trade-offs

- Write-capable dependency workflow risk -> Restrict to same-repository Dependabot PRs, grant only `contents: write`, avoid secrets, and commit only the generated worker types file.
- Workflow can be overwritten by Dependabot rebases -> Include `[dependabot skip]` and allow the fixer to rerun after Dependabot updates the branch.
- Generated output may change for reasons unrelated to Wrangler -> Running generation for all npm Dependabot PRs is simpler and deterministic; the workflow only commits when the tracked generated file changes.
- Infinite commit loop risk -> Commit only when `apps/app/worker-configuration.d.ts` has a diff after generation.
- CI duplication -> The fixer performs generation, while `verify` performs checking. This intentional duplication keeps verification authoritative.

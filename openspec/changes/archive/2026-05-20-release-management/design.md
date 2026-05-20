## Context

The repo currently has no release pipeline. `apps/app/package.json` carries a hardcoded `0.0.0-dev` version and the sidebar badge is a hardcoded string. Changesets packages are already installed in root `devDependencies`. `.changeset/config.json` exists with mostly correct settings. The existing `ci-cd.yml` workflow handles verification (lint, test, build) on both PRs and pushes to `main`.

This is a public-facing repo (soon to be public). The release target is GitHub Releases, not npm.

## Goals / Non-Goals

**Goals:**

- Automated Release PR creation and GitHub Release tagging on every merge to `main`
- Independent per-package versioning (only one app today, but the pattern is future-proof)
- Cache-free release job to prevent cache poisoning from PR branches
- Real version visible in the sidebar at runtime, injected at build time
- Developer docs for how to add changesets to PRs

**Non-Goals:**

- npm publish (this is a private app)
- Deployment automation (out of scope for this change)
- Monorepo-wide linked versioning

## Decisions

### 1. `pnpm changeset tag` as the publish command

**Decision**: Use `changesets/action@v1` with `publish: pnpm changeset tag` instead of a real npm publish command.

**Rationale**: `changeset tag` creates git tags for each bumped package. The action then pushes those tags, which GitHub converts into Releases. No npm publish happens. This is the correct pattern for apps that version via git tags only.

**Alternative considered**: `pnpm changeset publish` — requires a real npm registry and would attempt to publish, which we don't want for a private app.

### 2. Cache toggle via `inputs.cache` boolean in composite action

**Decision**: Add a `cache` boolean input (default `true`) to `.github/actions/setup/action.yml`. The release job passes `cache: false`.

**Rationale**: Cache poisoning risk — a PR from a fork could seed the pnpm store cache with malicious packages, which the release job would then restore. Skipping cache in the release job ensures a clean install. The input approach is idiomatic for GitHub composite actions and avoids duplicating the setup action.

**Alternative considered**: Separate `setup-uncached` action — more explicit but duplicates all other steps and increases maintenance surface.

### 3. `__APP_VERSION__` via Vite `define`

**Decision**: Read `apps/app/package.json` in `vite.config.ts` using `readFileSync` and inject the version as a `define` constant. In `development` mode, append `-dev` suffix. In `test` mode, use the raw version (no suffix).

**Rationale**: Vite `define` does a static find-and-replace at build time — the string literal is inlined, `package.json` is never bundled. This is the standard Vite pattern for injecting build-time constants.

**Why `readFileSync` in vite.config.ts**: The config file runs in Node context before the bundle is built, so a sync read is safe and simple. No need for a Vite plugin.

**Test mode**: Vitest inherits the `define` from `vite.config.ts`. The test for the version badge will need to match against the value produced in `test` mode (raw version, no `-dev`). The existing test uses `/v0\./i` which will still match `v0.0.0` — update it to match the exact test-mode value for clarity.

### 4. `release.yml` triggers on push to `main` only

**Decision**: Release workflow triggers on `push` to `main` with `cancel-in-progress: false` and `queue: max`.

**Rationale**: Releases only make sense post-merge. PRs already run `ci-cd.yml` checks, so by the time code reaches `main` it has been verified. Running `ci-cd.yml` in parallel on `main` push is acceptable — both workflows are independent. The `queue: max` ensures no release run is silently dropped when multiple PRs land in quick succession.

### 5. `0.0.0` as the starting version

**Decision**: Reset `apps/app/package.json` version from `0.0.0-dev` to `0.0.0`.

**Rationale**: Changesets expects a clean semver starting point. The `-dev` suffix was a manual convention; Changesets will own version bumps from here. The sidebar dev-mode display (`{version}-dev`) is now handled by `vite.config.ts` logic, not the version field itself.

## Risks / Trade-offs

- **`changeset tag` requires changesets to be consumed first** — the action only tags when the Release PR is merged (i.e., changesets have been applied via `changeset version`). If no changesets are present, the action is a no-op. This is expected behavior, not a bug.
- **First Release PR will bump from `0.0.0`** → `0.1.0` (or `1.0.0` depending on bump type). Ensure the first changeset is intentional.
- **Cache-free release job is slower** — clean pnpm install on every release. Acceptable for an infrequent release workflow.
- **Test-mode version** — `__APP_VERSION__` in tests will be `"0.0.0"` (from `package.json`). If version is bumped and tests aren't updated, the `/v0\./i` regex may still pass but the exact assertion would drift. Prefer a loose regex or `import.meta` mock for resilience.

## Migration Plan

1. Apply all file changes in a single PR on the `release-management` branch
2. Merge to `main` — this is the first push that will trigger `release.yml`
3. Since no changesets exist yet, the action creates an empty Release PR (or is a no-op depending on action version behavior)
4. Add a changeset (`pnpm changeset`) for the first real feature, open a PR, merge — this feeds the Release PR with a real entry
5. Merge the Release PR → `changeset tag` runs → GitHub Release is created at the tagged version

No rollback needed — the changes are additive (new workflow, modified action, version injection). Reverting is a standard git revert.

## Open Questions

- None — all decisions made in explore session.

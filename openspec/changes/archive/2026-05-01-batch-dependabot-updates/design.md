## Context

The repository currently uses a minimal Dependabot configuration (`version: 2`, `package-ecosystem: npm`, `directory: /`, `schedule: weekly`). Dependabot creates one pull request per dependency update. With ~60 total dependencies across the root workspace and `apps/app`, this results in excessive PR noise and fragmented review overhead.

The project uses pnpm workspaces (`pnpm-workspace.yaml`) with a single lockfile. Dependabot's `npm` ecosystem supports pnpm natively, including workspace detection via `pnpm-workspace.yaml`. For pnpm monorepos, only the root directory should be specified — Dependabot discovers workspace packages automatically and correctly updates the shared lockfile.

## Goals / Non-Goals

**Goals:**

- Reduce Dependabot PR volume by batching minor/patch updates into grouped PRs
- Separate major version bumps into their own group for explicit review
- Distinguish production and development dependency updates
- Scan both root and `apps/app` package manifests

**Non-Goals:**

- Auto-merge Dependabot PRs (out of scope for this change)
- Modify `minimumReleaseAge` cooling-off period
- Switch to Renovate or alternative dependency manager
- Change the weekly schedule interval

## Decisions

### Use single root `directory` for pnpm workspace

**Decision:** Use `directory: /` only. Dependabot reads `pnpm-workspace.yaml` and discovers all workspace packages automatically.

**Rationale:** For pnpm monorepos, explicitly listing subdirectories (via `directories` or multiple `updates` entries) can cause lockfile update bugs where subfolder package updates don't properly update `pnpm-lock.yaml`. Real-world testing confirms `directory: /` is the correct approach for pnpm workspaces.

**Alternative considered:** `directories: ["/", "/apps/app"]`. Rejected due to known pnpm lockfile update issues with explicit subdirectories.

### Separate prod and dev minor/patch groups

**Decision:** Create two groups for minor/patch updates: `prod-dependencies` (filtered by `dependency-type: production`) and `dev-dependencies` (filtered by `dependency-type: development`).

**Rationale:** Production dependency bumps carry higher risk than dev-only tooling updates. Separating them allows targeted review focus and clearer CI failure attribution.

**Alternative considered:** Single `all-minor-patch` group. Rejected because it conflates runtime and build-time dependencies in one PR.

### Major updates as a single cross-type group

**Decision:** All major updates (both prod and dev) go into one `major-updates` group.

**Rationale:** Major bumps are infrequent and always require human review regardless of dependency type. Splitting them further would add little value.

**Alternative considered:** Separate `major-prod` and `major-dev` groups. Rejected — majors are rare enough that one group is sufficient.

### Keep 48-hour `minimumReleaseAge`

**Decision:** Leave `minimumReleaseAge: 2880` (48 hours) in `pnpm-workspace.yaml` unchanged.

**Rationale:** It's a useful supply-chain security buffer. With grouped PRs, the occasional "red for 48h" is acceptable noise.

**Alternative considered:** Lower to 24 hours (`1440`). Rejected by user preference — willing to wait.

## Risks / Trade-offs

| Risk                                                                                               | Mitigation                                                                                                                                  |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependabot creates a PR for a package <48h old; CI fails on `pnpm install`                         | Expected and acceptable. PR will go green once cooling-off expires. Grouped PRs make this much less noisy than individual PRs.              |
| A shared dependency (e.g., `typescript`) exists in both root and app with different version ranges | Dependabot will bump both in the same group PR if updates are available. This is usually desirable — avoids version drift.                  |
| Explicit subdirectories in pnpm workspaces can cause lockfile update issues                        | Using `directory: /` only avoids this; Dependabot discovers workspace packages via `pnpm-workspace.yaml`                                    |
| Major group PR could bundle multiple breaking changes, making rollback harder                      | Mitigated by the fact that majors are rare. If CI passes, individual packages within the group can still be reverted via follow-up commits. |

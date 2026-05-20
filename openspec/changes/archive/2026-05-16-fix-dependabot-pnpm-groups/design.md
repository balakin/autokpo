## Context

Dependabot clones the repo fresh (no pnpm metadata cache) and runs `corepack pnpm update <pkg> --lockfile-only` for each dependency it wants to bump. pnpm 11.0.6's default `time-based` resolution mode requires the `time` field in npm registry metadata for every resolved package. `es-toolkit` (a transitive dep of `recharts`) is missing this field in its current npm metadata. This causes every update attempt to fail with `ERR_PNPM_MISSING_TIME`, so no PRs are ever created.

pnpm 11.1.2 fixes this: when the `time` field is missing, the resolver falls through to a registry-fetch path instead of throwing. Bumping `packageManager` is sufficient because dependabot reads this field and uses corepack to install the exact version before running updates.

The `major-updates` dependabot group is a separate, unrelated config issue: dependabot's specificity system assigns every dependency to either `dev-dependencies` or `prod-dependencies` (which have both `dependency-type` and `update-types` constraints — two constraints = more specific). `major-updates` has only one constraint (`update-types: [major]`), so it loses specificity for every dep and matches nothing. With `group-membership-enforcement` enabled by dependabot, a dep can belong to only one group, so `major-updates` is permanently empty. Removing it has no behavioral effect since majors already fall through to individual PRs.

## Goals / Non-Goals

**Goals:**

- Unblock dependabot PR creation by fixing the `ERR_PNPM_MISSING_TIME` crash
- Remove dead `major-updates` group config and its associated warning

**Non-Goals:**

- Changing pnpm resolution behavior (11.1.2 fix is transparent — no resolution mode change needed)
- Altering how major version updates are handled (individual PRs continue unchanged)
- Updating any other dependencies

## Decisions

**Bump pnpm to 11.1.2 rather than adding `resolution-mode=highest` to `.npmrc`**

The pnpm bug is fixed upstream. `resolution-mode=highest` is the workaround pnpm itself suggests in the error message, but it changes resolution behavior for all transitive deps going forward. Bumping to the version that contains the actual fix is cleaner, targeted, and doesn't alter resolution semantics.

**Remove `major-updates` group rather than restructuring it**

The group is non-functional and cannot be made to work as intended with the current specificity system (deps with both `dependency-type` and `update-types` constraints always win over deps with only `update-types`). The desired behavior — individual PRs for major updates — is already happening. Removing the group is the minimal change.

## Risks / Trade-offs

pnpm 11.1.2 is a patch release in the allowed `>=11 <12` range → Low risk. Patch releases are backwards-compatible by policy.

Removing `major-updates` produces no behavioral change → Zero risk.

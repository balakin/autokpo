## Context

`pnpm-workspace.yaml` has `minimumReleaseAge: 2880` (2880 minutes = 2 days), which prevents pnpm from installing packages published less than 2 days ago. Dependabot currently has no equivalent gate — it can open PRs for packages released minutes earlier. This is a one-field YAML addition to `.github/dependabot.yml`.

## Goals / Non-Goals

**Goals:**

- Add `cooldown: default-days: 2` to Dependabot's npm update entry
- Match the 2-day policy already enforced by pnpm at install time

**Non-Goals:**

- Per-semver granularity (minor/major/patch days) — not needed to match current pnpm policy
- Per-package include/exclude rules — not needed for this alignment
- Auto-reading `minimumReleaseAge` from pnpm config (open upstream issue [#13405](https://github.com/dependabot/dependabot-core/issues/13405), not yet supported)

## Decisions

**`default-days: 2` covers all semver levels uniformly.**
pnpm's `minimumReleaseAge` is not semver-aware — it applies the same 2-day gate to all versions. Using a single `default-days` matches that semantics. If pnpm policy changes, both files would need updating.

**Security updates are unaffected.**
Dependabot's cooldown is bypassed for security updates by design — this is the correct behavior; security patches should not be delayed.

## Risks / Trade-offs

- **Transitive dep gap**: Dependabot's cooldown only gates the direct dependency it's creating a PR for; transitive deps can still resolve to freshly-published versions. pnpm's `minimumReleaseAge` covers transitives at install time — so pnpm remains the backstop for that case. [Upstream issue #14683](https://github.com/dependabot/dependabot-core/issues/14683).
- **PRs open slightly later**: Any freshly-released package will wait 2 days before Dependabot raises a PR. Accepted trade-off for supply-chain safety.

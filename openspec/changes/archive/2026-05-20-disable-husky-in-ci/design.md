## Context

Husky installs git hooks via the `prepare` npm lifecycle script. In CI, `pnpm install --frozen-lockfile` triggers `prepare`, writing hooks into `.git/hooks/`. The hooks then fire on any `git commit` performed by CI tooling (e.g. `changesets/action`), running `pnpm build && pnpm test` and other local checks that are inappropriate in that context.

Husky v9 respects the `HUSKY` environment variable: setting `HUSKY=0` causes it to exit immediately during `prepare`, skipping hook installation entirely.

Both workflows (`ci-cd.yml` and `release.yml`) share `.github/actions/setup/action.yml` which runs `pnpm install`. Setting `HUSKY=0` there covers everything in one place.

## Goals / Non-Goals

**Goals:**

- Prevent Husky from installing git hooks during CI `pnpm install`
- Cover both `ci-cd.yml` and `release.yml` with a single change
- Leave local developer hook behavior completely unchanged

**Non-Goals:**

- Disabling specific hooks selectively
- Changing the hooks themselves
- Modifying CI lint/test steps (those run independently, not via hooks)

## Decisions

**Set `HUSKY=0` on the "Install dependencies" step in `setup/action.yml`**

The env var is scoped to that single step, which is the only place hooks get installed. Alternatives considered:

- _Job-level `env:` in each workflow_ — works but requires touching two files and drifts if more workflows are added.
- _`npm_config_ignore_scripts=true`_ — too broad; skips all lifecycle scripts, potentially breaking other `prepare` hooks from dependencies.
- _`.huskyrc` CI detection_ — fragile; depends on detecting CI env inside the hook scripts themselves.

## Risks / Trade-offs

- **Minimal risk** — `HUSKY=0` is the officially documented approach. The change is one env var on one step.
- [Hooks not running in CI] → This is intentional; CI already runs lint, tests, and build as explicit workflow steps.

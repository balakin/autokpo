## 1. Dependabot Configuration

- [ ] 1.1 Review `.github/dependabot.yml` and preserve the existing weekly npm and GitHub Actions update behavior with 2-day cooldown.
- [ ] 1.2 Make security-update grouping explicit for npm dependencies if needed, without disabling Dependabot vulnerability PRs.

## 2. Worker Types Fixer Workflow

- [ ] 2.1 Add a GitHub Actions workflow for Dependabot pull requests that targets dependency PRs requiring npm workspace setup.
- [ ] 2.2 Gate generation and commit steps so they run only for `dependabot[bot]` pull requests from the same repository.
- [ ] 2.3 Configure workflow permissions with deny-by-default behavior and only the minimal read/write scopes needed to inspect the PR and push a generated-file commit.
- [ ] 2.4 Use the shared setup action to install dependencies without exposing repository or deployment secrets.
- [ ] 2.5 Run `pnpm generate:worker-types` to regenerate `apps/app/worker-configuration.d.ts`.
- [ ] 2.6 Commit only `apps/app/worker-configuration.d.ts` when it changes, using a commit message containing `[dependabot skip]`.
- [ ] 2.7 Ensure the workflow does not create a commit when worker type generation produces no diff.

## 3. Verification

- [ ] 3.1 Run `pnpm check:worker-types` to verify generated Worker types are current.
- [ ] 3.2 Run a YAML/workflow syntax check where practical, or inspect the workflow for valid event, permission, checkout, setup, generation, diff, and commit behavior.
- [ ] 3.3 Run `openspec status --change "add-dependabot-worker-types-fixer"` and confirm the change is apply-ready.

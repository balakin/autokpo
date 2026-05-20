## 1. Update Dependabot configuration

- [x] 1.1 Rewrite `.github/dependabot.yml` with grouped updates, three groups (prod-dependencies, dev-dependencies, major-updates), and directories `[/, /apps/app]`
- [x] 1.2 Validate YAML syntax

## 2. Verify and commit

- [x] 2.1 Run `git diff` to review the change
- [x] 2.2 Commit with conventional commit message (`chore: batch dependabot updates into groups`)

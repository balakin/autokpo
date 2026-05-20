## 1. Update Dependabot Configuration

- [x] 1.1 Add `cooldown: default-days: 2` to the `npm` update entry in `.github/dependabot.yml`

## 2. Verify

- [x] 2.1 Confirm `cooldown` field is nested correctly under the `npm` package-ecosystem entry (not at the top level)
- [x] 2.2 Confirm `minimumReleaseAge: 2880` in `pnpm-workspace.yaml` still reads as 2880 minutes (2 days) — no change needed, just a cross-check

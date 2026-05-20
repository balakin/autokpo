## 1. Bump pnpm version

- [x] 1.1 Update `packageManager` in root `package.json` from `pnpm@11.0.6` to `pnpm@11.1.2` (update the sha512 hash too via `corepack use pnpm@11.1.2`)
- [x] 1.2 Verify engines constraint `>=11 <12` still satisfied

## 2. Clean up dependabot groups

- [x] 2.1 Remove the `major-updates` group from `.github/dependabot.yml`

## 3. Verify

- [x] 3.1 Run `pnpm install` locally to confirm no regressions with pnpm 11.1.2
- [x] 3.2 Confirm `pnpm update <any-outdated-pkg> --lockfile-only` succeeds without `ERR_PNPM_MISSING_TIME`

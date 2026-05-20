## 1. Changeset Configuration

- [x] 1.1 Add `@changesets/cli` and `@changesets/changelog-github` to root `devDependencies` and run `pnpm install`
- [x] 1.2 Run `pnpm changeset init` to generate `.changeset/config.json`
- [x] 1.3 Configure `.changeset/config.json`: set `changelog` to `["@changesets/changelog-github", { "repo": "<owner>/<repo>" }]`, `"fixed": []`, `"linked": []`, `"access": "restricted"`, and `"privatePackages": { "version": true, "tag": true }`

## 2. Setup Action — Cache Toggle

- [x] 2.1 Add `inputs.cache` boolean input (default `true`) to `.github/actions/setup/action.yml`
- [x] 2.2 Wrap the "Get pnpm store path" and "Cache pnpm store" steps with `if: ${{ inputs.cache == 'true' }}` conditionals

## 3. Release Workflow

- [x] 3.1 Create `.github/workflows/release.yml` triggered on `push` to `main` with concurrency group `${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: false`, and `queue: max`
- [x] 3.2 Add `permissions: contents: write, issues: write, pull-requests: write` to the release job
- [x] 3.3 Add checkout step (`actions/checkout@v6`) with `fetch-depth: 0` (Changesets needs full history)
- [x] 3.4 Add setup step using `./.github/actions/setup` with `cache: false`
- [x] 3.5 Add `changesets/action@v1` step with `publish: pnpm changeset tag`, `title: 'chore: release packages'`, `commit: 'chore: release packages'`, and `GITHUB_TOKEN` env

## 4. App Version Injection

- [x] 4.1 Reset `apps/app/package.json` version from `"0.0.0-dev"` to `"0.0.0"`
- [x] 4.2 In `apps/app/vite.config.ts`, read `apps/app/package.json` via `readFileSync` and add a `define` block: `__APP_VERSION__` = version string in production/test, version + `-dev` in development mode
- [x] 4.3 Add `declare const __APP_VERSION__: string` to `apps/app/src/vite-env.d.ts` (or equivalent global types file) so TypeScript recognises the constant
- [x] 4.4 Update `apps/app/src/app-shell/sidebar.tsx` to replace the hardcoded `v0.0.0-dev` with `__APP_VERSION__` prefixed by `v`
- [x] 4.5 Update `apps/app/src/app-shell/__tests__/app-shell.spec.tsx` version badge test to match the value produced in test mode (raw version, no `-dev` suffix, e.g. `v0.0.0`)

## 5. README

- [x] 5.1 Add a "Releases" section to the root `README.md` explaining how to use Changesets: running `pnpm changeset`, the Release PR flow, and a link to the official Changesets docs

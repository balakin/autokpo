### Requirement: Changesets drives versioning and changelog

The project SHALL use `@changesets/cli` for versioning. Each feature or fix PR MAY include a changeset file (created via `pnpm changeset`). Changesets SHALL be independent per package (no fixed or linked groups). Versions SHALL be bumped only when a changeset is present and the Release PR is merged.

#### Scenario: Developer adds a changeset to a PR

- **WHEN** a developer runs `pnpm changeset` in the repo root
- **THEN** the CLI SHALL prompt for bump type (major/minor/patch) and a summary
- **AND** a new changeset file SHALL be created in `.changeset/`
- **AND** the file SHALL be committed alongside the PR changes

#### Scenario: No changeset on a PR

- **WHEN** a PR is merged to `main` with no changeset file
- **THEN** no version bump SHALL occur
- **AND** the release workflow SHALL be a no-op for publish (Release PR stays unchanged or no PR is created)

### Requirement: CI creates and maintains a Release Pull Request

A GitHub Actions workflow (`release.yml`) SHALL run on every push to `main`. When unconsumed changesets exist, the workflow SHALL create or update a Release Pull Request titled `chore: release packages`. When no unconsumed changesets exist, the workflow SHALL run `pnpm changeset tag` to create git tags for any newly versioned packages.

#### Scenario: Release PR is created after a changeset lands on main

- **WHEN** a PR with a changeset file is merged to `main`
- **THEN** the release workflow SHALL create or update a pull request with title `chore: release packages`
- **AND** the PR SHALL contain version bumps and changelog entries for all pending changesets

#### Scenario: Release PR is merged

- **WHEN** the Release PR (`chore: release packages`) is merged to `main`
- **THEN** the release workflow SHALL run `pnpm changeset tag`
- **AND** git tags SHALL be created for each bumped package
- **AND** GitHub SHALL create a Release for each tag

#### Scenario: Concurrent pushes to main are queued

- **WHEN** multiple pushes to `main` occur in quick succession
- **THEN** release workflow runs SHALL queue (up to 100) rather than cancel
- **AND** each run SHALL complete in order

### Requirement: Release workflow uses a cache-free dependency install

The release job SHALL invoke `.github/actions/setup` with `cache: false` to perform a clean pnpm install, mitigating the risk of cache poisoning from PR-sourced cache entries.

#### Scenario: Release job installs dependencies without cache

- **WHEN** the release workflow runs
- **THEN** the pnpm store cache SHALL NOT be restored or saved
- **AND** `pnpm install --frozen-lockfile` SHALL run against the registry directly

### Requirement: Releases target GitHub only, not npm

All packages are private. The Changesets config SHALL use `access: restricted` and `privatePackages.tag: true`. No package SHALL be published to npm.

#### Scenario: Changeset tag creates a GitHub Release

- **WHEN** `pnpm changeset tag` runs after a Release PR merge
- **THEN** git tags SHALL be pushed and visible as GitHub Releases
- **AND** no npm publish SHALL occur

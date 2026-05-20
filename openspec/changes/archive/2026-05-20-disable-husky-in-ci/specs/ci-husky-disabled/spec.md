## ADDED Requirements

### Requirement: Husky hooks are disabled in CI environments

The CI setup action SHALL set `HUSKY=0` as an environment variable on the dependency installation step so that Husky skips hook installation when running in CI/CD pipelines.

#### Scenario: Husky does not install hooks during CI pnpm install

- **WHEN** `pnpm install --frozen-lockfile` runs in a CI environment using the shared setup action
- **THEN** Husky SHALL not write any files to `.git/hooks/`

#### Scenario: Local developer hooks are unaffected

- **WHEN** a developer runs `pnpm install` on their local machine
- **THEN** Husky SHALL install git hooks as normal (the `HUSKY=0` variable is not set locally)

#### Scenario: Release tooling git commits do not trigger hooks

- **WHEN** `changesets/action` or any other CI tool performs a `git commit` during a release workflow
- **THEN** no Husky hooks SHALL fire, because hooks were never installed in the CI environment

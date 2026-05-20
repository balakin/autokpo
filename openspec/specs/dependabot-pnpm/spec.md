## ADDED Requirements

### Requirement: Dependabot runs complete without pnpm resolution errors

Dependabot SHALL successfully update the pnpm lockfile for any dependency without hitting `ERR_PNPM_MISSING_TIME`, even in a cold-cache environment where package metadata must be fetched fresh from the npm registry.

#### Scenario: Dependabot updates a minor dependency

- **WHEN** dependabot runs `pnpm update <package>@<version> --lockfile-only`
- **THEN** the command exits 0 and the lockfile is updated

### Requirement: Dependabot groups match all dependencies without warnings

Dependabot's group configuration SHALL have no groups that produce a "no dependencies match" warning.

#### Scenario: All configured groups match at least one dependency

- **WHEN** dependabot processes the version update job
- **THEN** no "groups where no dependencies match" warning is emitted

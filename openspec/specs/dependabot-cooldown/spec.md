## ADDED Requirements

### Requirement: Dependabot enforces a 2-day cooldown before opening version update PRs

The system SHALL delay opening Dependabot version update pull requests until at least 2 days have elapsed since the package version was published, matching the 2-day `minimumReleaseAge` enforced by pnpm at install time.

#### Scenario: Package released less than 2 days ago

- **WHEN** Dependabot detects a new package version published less than 2 days ago
- **THEN** Dependabot SHALL NOT open a pull request for that version until the 2-day cooldown has elapsed

#### Scenario: Package released 2 or more days ago

- **WHEN** Dependabot detects a new package version published 2 or more days ago
- **THEN** Dependabot SHALL open a pull request for that version as normal

#### Scenario: Security update bypasses cooldown

- **WHEN** a package version is flagged as a security update
- **THEN** Dependabot SHALL open the pull request immediately, regardless of the cooldown period

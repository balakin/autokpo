## ADDED Requirements

### Requirement: Dependabot groups dependency updates

The system SHALL batch Dependabot dependency updates into no more than three groups per weekly scan.

#### Scenario: Production minor/patch updates

- **WHEN** one or more production dependencies have minor or patch updates available
- **THEN** Dependabot creates a single pull request titled with the group name containing all applicable updates

#### Scenario: Development minor/patch updates

- **WHEN** one or more development dependencies have minor or patch updates available
- **THEN** Dependabot creates a single pull request titled with the group name containing all applicable updates

#### Scenario: Major version updates

- **WHEN** one or more dependencies have major version updates available
- **THEN** Dependabot creates a single pull request containing all major updates regardless of dependency type

### Requirement: Dependabot scans all workspace packages

The system SHALL scan all workspace packages by reading `pnpm-workspace.yaml` from the repository root.

#### Scenario: Root package updates

- **WHEN** a dependency in the root `package.json` has an update
- **THEN** Dependabot includes it in the appropriate group PR

#### Scenario: Workspace package updates

- **WHEN** a dependency in any workspace package (e.g., `apps/app/package.json`) has an update
- **THEN** Dependabot includes it in the appropriate group PR

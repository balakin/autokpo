## MODIFIED Requirements

### Requirement: pnpm workspace declares apps only

The `pnpm-workspace.yaml` at the repository root SHALL declare `packages: ["apps/*"]`. The `packages/` directory SHALL NOT exist in the repository. The root `package.json` SHALL NOT list these directories in a `workspaces` field (pnpm uses `pnpm-workspace.yaml` exclusively).

#### Scenario: pnpm install links workspace packages

- **WHEN** a developer runs `pnpm install` from the repository root
- **THEN** pnpm SHALL install dependencies for all workspace packages under `apps/` and create symlinks between them

#### Scenario: New app can be added to apps/

- **WHEN** a developer creates a new directory under `apps/` with a valid `package.json`
- **THEN** pnpm SHALL recognize it as a workspace package on the next `pnpm install`

#### Scenario: No packages/ directory exists

- **WHEN** the repository root is inspected
- **THEN** there SHALL be no `packages/` directory present

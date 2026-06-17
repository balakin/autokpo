## ADDED Requirements

### Requirement: Dependabot npm PRs regenerate worker types when needed

The system SHALL automatically regenerate the app's tracked Cloudflare Worker types for same-repository Dependabot npm pull requests and include the regenerated file in the pull request when the output changes.

#### Scenario: Worker type output changes after dependency update

- **WHEN** a Dependabot npm pull request updates dependencies and `pnpm generate:worker-types` changes `apps/app/worker-configuration.d.ts`
- **THEN** the system SHALL commit the updated `apps/app/worker-configuration.d.ts` file to the Dependabot pull request branch

#### Scenario: Worker type output is unchanged after dependency update

- **WHEN** a Dependabot npm pull request updates dependencies and `pnpm generate:worker-types` leaves `apps/app/worker-configuration.d.ts` unchanged
- **THEN** the system SHALL NOT create an additional commit

### Requirement: Dependabot generated-type commits preserve bot rebasing

Generated worker type commits on Dependabot branches SHALL use a commit message containing `[dependabot skip]` so Dependabot remains allowed to force-push over the extra commit during rebase or recreate operations.

#### Scenario: Generated worker type commit is created

- **WHEN** the system commits regenerated `apps/app/worker-configuration.d.ts` to a Dependabot pull request branch
- **THEN** the commit message SHALL contain `[dependabot skip]`

#### Scenario: Dependabot later rebases the pull request

- **WHEN** Dependabot rebases or recreates a pull request after a generated worker type commit was added
- **THEN** Dependabot SHALL remain permitted to overwrite the generated worker type commit

### Requirement: Dependabot worker type fixer is permission-restricted

The worker type fixer SHALL run only for same-repository Dependabot npm pull requests and SHALL use the minimum repository permissions required to read pull request context and write the generated-file commit.

#### Scenario: Pull request is not authored by Dependabot

- **WHEN** a pull request is authored by any actor other than `dependabot[bot]`
- **THEN** the worker type fixer SHALL NOT run its generation or commit steps

#### Scenario: Pull request branch is from a fork

- **WHEN** a pull request branch repository differs from the base repository
- **THEN** the worker type fixer SHALL NOT run its generation or commit steps

#### Scenario: Workflow permissions are evaluated

- **WHEN** the worker type fixer workflow runs
- **THEN** it SHALL NOT request deploy permissions, cloud provider secrets, package publishing permissions, or broad write-all permissions

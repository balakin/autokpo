## MODIFIED Requirements

### Requirement: Worker type generation

The system SHALL provide `pnpm generate:worker-types` to regenerate `worker-configuration.d.ts` from `wrangler.jsonc`, and `pnpm check:worker-types` to verify the generated types are up to date. These scripts SHALL be defined in `apps/app/package.json` and invoked from the repository root via `turbo run generate:worker-types` and `turbo run check:worker-types`.

#### Scenario: Type generation after config change

- **WHEN** a developer modifies `wrangler.jsonc` and runs `pnpm generate:worker-types`
- **THEN** `turbo run generate:worker-types` delegates to `@autokpo/app` where `wrangler types` regenerates `worker-configuration.d.ts`

#### Scenario: CI rejects stale types

- **WHEN** `wrangler.jsonc` has changed but `worker-configuration.d.ts` has not been regenerated
- **THEN** `turbo run check:worker-types` delegates to `@autokpo/app` where `wrangler types --check` exits with a non-zero code

---

### Requirement: Pre-commit and CI enforcement

The system SHALL enforce worker type freshness via `turbo run check:worker-types` in both the pre-commit hook and the CI pipeline.

#### Scenario: Pre-commit hook checks types

- **WHEN** a developer commits changes
- **THEN** the pre-commit hook runs `pnpm lint-staged`, `turbo run i18n:extract`, `git add apps/app/src/locales/`, and `turbo run check:worker-types`

#### Scenario: CI pipeline checks types

- **WHEN** the CI pipeline runs
- **THEN** it includes a step that runs `turbo run check:worker-types` after setup

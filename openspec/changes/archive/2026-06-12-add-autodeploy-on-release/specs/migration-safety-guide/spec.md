## ADDED Requirements

### Requirement: Migration safety guide document

The system SHALL provide a migration safety guide at `apps/app/docs/migrations.md` that states the migrate-before-deploy invariant and classifies D1 schema migrations as safe or unsafe to auto-apply on release.

#### Scenario: Guide states the invariant

- **WHEN** a contributor reads `apps/app/docs/migrations.md`
- **THEN** it states that, because migrations run before the worker deploys, every migration must be tolerated by the currently-live (old) worker

#### Scenario: Guide classifies migrations

- **WHEN** a contributor reads the guide
- **THEN** it contains a table classifying common migrations (create table/index, add nullable column, additive backfill, add NOT NULL, add unique, type narrowing, rename, drop) as safe, risky, or breaking on release

### Requirement: Edge-case migration recipes

The guide SHALL provide step-by-step expand/contract recipes for the migrations that are unsafe to apply in a single release: column rename, column/table drop, adding a NOT NULL column, and adding a UNIQUE constraint.

#### Scenario: Rename recipe is three releases

- **WHEN** a contributor needs to rename a column
- **THEN** the guide describes the three-release expand/contract sequence (add + backfill + dual-write, then switch to new only, then drop old) and warns against answering yes to drizzle-kit's rename prompt

#### Scenario: Drop recipe is two releases

- **WHEN** a contributor needs to drop a column or table
- **THEN** the guide describes shipping code that stops referencing it first, then dropping it in a later release

#### Scenario: NOT NULL and UNIQUE recipes preserve safety

- **WHEN** a contributor needs to add a NOT NULL column or a UNIQUE constraint
- **THEN** the guide describes expanding (nullable add / dedup backfill) before tightening the constraint in a later release

### Requirement: Expand/contract rule referenced from agent guidance

`apps/app/CLAUDE.md` SHALL reference the expand/contract rule and link to `apps/app/docs/migrations.md`, so coding agents do not generate single-shot rename or drop migrations.

#### Scenario: Agent guidance links the rule

- **WHEN** an agent reads `apps/app/CLAUDE.md`
- **THEN** it finds the expand/contract rule for D1 migrations and a pointer to `docs/migrations.md`

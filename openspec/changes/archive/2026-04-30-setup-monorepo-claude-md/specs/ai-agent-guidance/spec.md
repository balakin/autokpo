## ADDED Requirements

### Requirement: Root CLAUDE.md describes monorepo structure and invocation patterns

The root `CLAUDE.md` SHALL describe the monorepo layout (`apps/app/` as `@autokpo/app`, empty `packages/`), Node 24 and pnpm 10 requirements, Conventional Commits convention, and how to invoke tasks from the root: `turbo run <task>` for build/dev/test, and `pnpm --filter @autokpo/app <script>` for app-specific scripts. It SHALL NOT contain app-specific commands, module layout, or coding conventions.

#### Scenario: Root CLAUDE.md loaded for root-level work

- **WHEN** an AI agent works from the repository root
- **THEN** it SHALL have context for monorepo layout, turbo invocation, and filter-based script execution without needing to open `apps/app/CLAUDE.md`

#### Scenario: Root CLAUDE.md does not duplicate app conventions

- **WHEN** the root `CLAUDE.md` is inspected
- **THEN** it SHALL NOT contain app-specific content such as HeroUI instructions, i18n rules, CRDT patterns, or icon constraints

---

### Requirement: Root CLAUDE.md contains abstract token-efficiency principles

The root `CLAUDE.md` SHALL contain a section on token-efficient command patterns as tool-agnostic principles: prefix `pnpm` with `-s`, prefer JSON output piped to `jq`, scope vitest with `--changed` during iteration, use `pnpm eslint` and `pnpm prettier` for individual tool inspection, and never pipe `pnpm lint` or `pnpm lint:fix` (chain commands). It SHALL NOT contain concrete app-specific jq filter snippets.

#### Scenario: Lint chain commands are never piped

- **WHEN** an AI agent needs to check lint output
- **THEN** root `CLAUDE.md` SHALL direct it to run `pnpm eslint` with `--format=json` separately, not pipe `pnpm lint`

#### Scenario: Test output uses JSON reporter

- **WHEN** an AI agent runs tests
- **THEN** root `CLAUDE.md` SHALL direct it to use `--reporter=json` and extract fields with `jq`

---

### Requirement: apps/app/CLAUDE.md contains all app-specific guidance

The `apps/app/CLAUDE.md` file SHALL contain: the AutoKPO app description, all app scripts with one-line descriptions (noting they are runnable via `pnpm --filter @autokpo/app <script>` from root), the module layout for `src/crdt/` and `worker/`, and all coding conventions (HeroUI v3, i18n/Lingui, CRDT/Yjs, Tailwind v4, React Compiler, icons, import rules, test requirements, library docs lookup). It SHALL NOT repeat monorepo structure or token-efficiency principles already covered in root `CLAUDE.md`.

#### Scenario: App CLAUDE.md loaded when working inside apps/app/

- **WHEN** an AI agent reads or edits a file under `apps/app/`
- **THEN** `apps/app/CLAUDE.md` SHALL be loaded and its conventions SHALL apply alongside root `CLAUDE.md`

#### Scenario: App conventions not duplicated at root

- **WHEN** `apps/app/CLAUDE.md` is inspected
- **THEN** it SHALL contain HeroUI, i18n, CRDT, icons, and other app-specific conventions that are absent from root `CLAUDE.md`

---

### Requirement: AGENTS.md files mirror CLAUDE.md files

The root `AGENTS.md` SHALL contain identical content to root `CLAUDE.md`. The `apps/app/AGENTS.md` file SHALL contain identical content to `apps/app/CLAUDE.md`. Both pairs SHALL be updated together whenever guidance changes.

#### Scenario: AGENTS.md reflects current root guidance

- **WHEN** root `CLAUDE.md` is updated
- **THEN** root `AGENTS.md` SHALL be updated in the same commit to maintain identical content

#### Scenario: apps/app/AGENTS.md reflects current app guidance

- **WHEN** `apps/app/CLAUDE.md` is updated
- **THEN** `apps/app/AGENTS.md` SHALL be updated in the same commit to maintain identical content

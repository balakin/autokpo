## Requirements

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

The `apps/app/CLAUDE.md` file SHALL contain: the AutoKPO app description, all app scripts with one-line descriptions, the module layout for `src/crdt/` and `worker/`, and all app-specific coding conventions. Those conventions SHALL include HeroUI v3 guidance, i18n/Lingui rules, CRDT/Yjs patterns, icon usage, selector-first Yjs reads, entity-scoped mutation namespaces, shallow-equality-friendly selector design, and the testing policy for selector/mutation unit tests plus UI integration tests seeded with real Yjs state. It SHALL NOT repeat monorepo structure or token-efficiency principles already covered in the root guidance files.

#### Scenario: App CLAUDE.md loaded when working inside apps/app/

- **WHEN** an AI agent reads or edits a file under `apps/app/`
- **THEN** `apps/app/CLAUDE.md` SHALL be loaded and its conventions SHALL apply alongside the root guidance

#### Scenario: App guidance describes selector and mutation architecture

- **WHEN** an AI agent plans or implements a Yjs-backed feature inside `apps/app/`
- **THEN** `apps/app/CLAUDE.md` SHALL instruct it to read state through `useYDoc` selectors, write state through entity-scoped mutation functions, and avoid reintroducing feature-level provider wrappers for Yjs-backed state

---

### Requirement: AGENTS.md files mirror CLAUDE.md files

The root `AGENTS.md` SHALL contain identical content to root `CLAUDE.md`. The `apps/app/AGENTS.md` file SHALL contain identical content to `apps/app/CLAUDE.md`. Both pairs SHALL be updated together whenever guidance changes.

#### Scenario: AGENTS.md reflects current root guidance

- **WHEN** root `CLAUDE.md` is updated
- **THEN** root `AGENTS.md` SHALL be updated in the same commit to maintain identical content

#### Scenario: apps/app/AGENTS.md reflects current app guidance

- **WHEN** `apps/app/CLAUDE.md` is updated
- **THEN** `apps/app/AGENTS.md` SHALL be updated in the same commit to maintain identical content

---

### Requirement: apps/app/CLAUDE.md documents the flat-module convention

`apps/app/CLAUDE.md` SHALL include a **Module structure** convention that states:

- Every concern lives in its own folder under `src/`; files inside a module are flat (no nested subfolders)
- `__tests__/` is the one allowed subfolder for co-located tests
- Modules may have an optional `index.ts` public entrypoint barrel
- The `src/` root is reserved for `index.css`, `main.tsx`, `constants.ts`, and `vite-env.d.ts`
- `src/__tests__/` SHALL NOT be created or used; any file needing tests must live in a named module

#### Scenario: Agent adds a new source file

- **WHEN** an AI agent adds a new file to the project
- **THEN** `apps/app/CLAUDE.md` SHALL instruct it to place the file inside an appropriate module folder, never directly in `src/`

#### Scenario: Agent adds a test

- **WHEN** an AI agent writes a test
- **THEN** `apps/app/CLAUDE.md` SHALL instruct it to place the test in the owning module's `__tests__/` subfolder

---

### Requirement: apps/app/AGENTS.md mirrors apps/app/CLAUDE.md for the flat-module convention

`apps/app/AGENTS.md` SHALL contain identical content to `apps/app/CLAUDE.md`, including the flat-module convention. Both files SHALL be updated in the same commit when guidance changes.

#### Scenario: CLAUDE.md is updated with the module convention

- **WHEN** `apps/app/CLAUDE.md` is updated to add the flat-module convention
- **THEN** `apps/app/AGENTS.md` SHALL be updated identically in the same commit

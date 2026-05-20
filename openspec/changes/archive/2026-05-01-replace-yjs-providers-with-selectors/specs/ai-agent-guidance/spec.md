## MODIFIED Requirements

### Requirement: apps/app/CLAUDE.md contains all app-specific guidance

The `apps/app/CLAUDE.md` file SHALL contain: the AutoKPO app description, all app scripts with one-line descriptions, the module layout for `src/crdt/` and `worker/`, and all app-specific coding conventions. Those conventions SHALL include HeroUI v3 guidance, i18n/Lingui rules, CRDT/Yjs patterns, icon usage, selector-first Yjs reads, entity-scoped mutation namespaces, shallow-equality-friendly selector design, and the testing policy for selector/mutation unit tests plus UI integration tests seeded with real Yjs state. It SHALL NOT repeat monorepo structure or token-efficiency principles already covered in the root guidance files.

#### Scenario: App CLAUDE.md loaded when working inside apps/app/

- **WHEN** an AI agent reads or edits a file under `apps/app/`
- **THEN** `apps/app/CLAUDE.md` SHALL be loaded and its conventions SHALL apply alongside the root guidance

#### Scenario: App guidance describes selector and mutation architecture

- **WHEN** an AI agent plans or implements a Yjs-backed feature inside `apps/app/`
- **THEN** `apps/app/CLAUDE.md` SHALL instruct it to read state through `useYDoc` selectors, write state through entity-scoped mutation functions, and avoid reintroducing feature-level provider wrappers for Yjs-backed state

### Requirement: AGENTS.md files mirror CLAUDE.md files

The root `AGENTS.md` SHALL contain identical content to the root `CLAUDE.md`. The `apps/app/AGENTS.md` file SHALL contain identical content to `apps/app/CLAUDE.md`. Both pairs SHALL be updated together whenever guidance changes.

#### Scenario: AGENTS.md reflects current root guidance

- **WHEN** the root `CLAUDE.md` is updated
- **THEN** the root `AGENTS.md` SHALL be updated in the same commit to maintain identical content

#### Scenario: apps/app/AGENTS.md reflects current app guidance

- **WHEN** `apps/app/CLAUDE.md` is updated
- **THEN** `apps/app/AGENTS.md` SHALL be updated in the same commit to maintain identical content

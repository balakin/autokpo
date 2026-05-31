## ADDED Requirements

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

## Requirements

### Requirement: Each concern lives in its own module folder under src/

Every logical concern in `apps/app/src/` SHALL live in a dedicated subfolder (module). Files inside a module SHALL be flat — no subfolders within a module, except the two allowed exceptions listed below. The `src/` root is reserved for exactly: `index.css`, `main.tsx`, `constants.ts`, and `vite-env.d.ts`. No other files SHALL be added directly to `src/`.

#### Scenario: New utility added to the project

- **WHEN** a developer adds a new utility function
- **THEN** it SHALL be placed in `src/utils/<name>.ts`, not in `src/<name>.ts`

#### Scenario: New feature module created

- **WHEN** a developer creates a new feature module
- **THEN** it SHALL get its own folder (e.g., `src/payments/`) with all files flat inside it

#### Scenario: Attempting to add a file directly to src/ root

- **WHEN** a file that is not `index.css`, `main.tsx`, `constants.ts`, or `vite-env.d.ts` is proposed for the `src/` root
- **THEN** it SHALL be redirected to an appropriate module folder

---

### Requirement: Tests live in **tests**/ inside the owning module

Each module's tests SHALL be co-located in a `__tests__/` subfolder within that module (e.g., `src/utils/__tests__/`). A root `src/__tests__/` folder SHALL NOT exist. Any file that requires tests MUST live in a named module, not at the `src/` root.

#### Scenario: Test added for a utility function

- **WHEN** a test is written for `src/utils/belgrade-date.ts`
- **THEN** it SHALL be placed at `src/utils/__tests__/belgrade-date.spec.ts`

#### Scenario: Root **tests** folder proposed

- **WHEN** a developer proposes adding a test to `src/__tests__/`
- **THEN** it SHALL be rejected and the file SHALL be moved to the owning module's `__tests__/` folder

---

### Requirement: Modules may expose an index.ts public entrypoint

A module MAY have an `index.ts` (or `index.tsx`) file that re-exports its public surface. This is the one additional subfolder exception alongside `__tests__/`. External code importing from a module SHOULD import from the module's `index.ts` when one exists, rather than reaching into internal files.

#### Scenario: Module has a clear public API

- **WHEN** a module exposes a subset of its internals to the rest of the app
- **THEN** it SHALL provide an `index.ts` that explicitly re-exports those symbols

#### Scenario: Importing from a module with an index

- **WHEN** `main.tsx` or another module imports from `src/router/`
- **THEN** it SHALL import from `'./router'` (resolved to `router/index.ts`), not from `'./router/router'`

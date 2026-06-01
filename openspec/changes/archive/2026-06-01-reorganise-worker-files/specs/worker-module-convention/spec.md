## ADDED Requirements

### Requirement: Each concern in worker/ lives in its own module folder

Every logical concern in `apps/app/worker/` SHALL live in a dedicated subfolder (module). Files inside a module SHALL be flat — no subfolders within a module, with two exceptions: `__tests__/` (co-located tests) and `db/` (structural exception for Drizzle migrations and schema). The `worker/` root is reserved for exactly: `main.ts`, `env.d.ts`, `context.ts`, and `constants.ts`. No other files SHALL be added directly to `worker/`.

#### Scenario: New worker utility added

- **WHEN** a developer adds a new worker utility or handler
- **THEN** it SHALL be placed in an appropriate module folder (e.g., `worker/auth/helper.ts`), not directly at `worker/helper.ts`

#### Scenario: Attempting to add a file directly to worker/ root

- **WHEN** a file that is not `main.ts`, `env.d.ts`, `context.ts`, or `constants.ts` is proposed for the `worker/` root
- **THEN** it SHALL be redirected to an appropriate module folder

---

### Requirement: Worker tests live in **tests**/ inside the owning module

Each worker module's tests SHALL be co-located in a `__tests__/` subfolder within that module (e.g., `worker/routes/__tests__/`). A root `worker/__tests__/` folder SHALL NOT exist. Any worker file that requires tests MUST live in a named module, not at the `worker/` root.

#### Scenario: Test added for a route handler

- **WHEN** a test is written for `worker/routes/sync.ts`
- **THEN** it SHALL be placed at `worker/routes/__tests__/sync.spec.ts`

#### Scenario: Root worker/**tests** folder proposed

- **WHEN** a developer proposes adding a test to `worker/__tests__/`
- **THEN** it SHALL be rejected and the file SHALL be moved to the owning module's `__tests__/` folder

---

### Requirement: The worker entry point is a thin re-export

`worker/main.ts` SHALL only re-export the assembled Hono app from `worker/app/app.ts`. It SHALL NOT contain route registration, middleware wiring, or business logic.

#### Scenario: Adding a new route to the worker

- **WHEN** a developer adds a new API route
- **THEN** the route SHALL be registered in `worker/app/app.ts`, not in `worker/main.ts`

---

### Requirement: Middleware folder uses plural name

The worker middleware folder SHALL be named `middlewares/` (plural), consistent with the naming style used elsewhere in the codebase.

#### Scenario: Adding a new middleware

- **WHEN** a developer creates a new Hono middleware
- **THEN** it SHALL be placed at `worker/middlewares/<name>.ts`

---

### Requirement: db/ is the structural exception

`worker/db/` MAY contain nested subfolders (`migrations/`, `schema/`) because Drizzle tooling requires this layout. All other worker modules SHALL remain flat (no nested subfolders beyond `__tests__/`).

#### Scenario: Adding a new DB schema file

- **WHEN** a developer adds a new Drizzle schema table
- **THEN** it SHALL be placed in `worker/db/schema/` following the existing nested layout

#### Scenario: Adding a non-DB module with nested subfolders

- **WHEN** a developer proposes creating `worker/routes/v2/` or another nested subfolder outside `db/`
- **THEN** it SHALL be rejected; flat structure SHALL be maintained within the module

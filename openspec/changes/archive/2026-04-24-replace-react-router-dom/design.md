## Context

React Router v7 unified the browser-specific entry point into `react-router`. The package `react-router-dom` is now a thin re-export layer that adds no value. The project already declares `react-router@^7.14.2` as a direct dependency in `package.json`, but every source and test file still imports from `react-router-dom`. Since `react-router-dom` is not in `package.json`, it is only present as a transitive companion — an implicit dependency that should be removed.

There are 9 production files and ~10 test files importing from `react-router-dom`. The production code uses the v7 data-router API (`createBrowserRouter`/`RouterProvider`), while some test files still use the legacy component API (`<MemoryRouter>`, `<Routes>`, `<Route>`).

**Import mapping:**

| react-router-dom import                                 | react-router equivalent                              |
| ------------------------------------------------------- | ---------------------------------------------------- |
| `Navigate`, `Outlet`, `Link`                            | `react-router` (root)                                |
| `useNavigate`, `useLocation`, `useParams`, `useBlocker` | `react-router` (root)                                |
| `createBrowserRouter`, `RouterProvider`                 | `react-router/dom` subpath export                    |
| `createMemoryRouter`                                    | `react-router` (root)                                |
| `MemoryRouter`, `Route`, `Routes` (legacy)              | Replace with `createMemoryRouter` + `RouterProvider` |

## Goals / Non-Goals

**Goals:**

- Replace all `react-router-dom` imports with `react-router` (or `react-router/dom` for browser-specific exports)
- Remove the `react-router-dom` package from `node_modules`
- Migrate legacy test patterns (`<MemoryRouter>`, `<Routes>`, `<Route>`) to the data-router pattern (`createMemoryRouter` + `RouterProvider`) for consistency
- All existing tests continue to pass after the change

**Non-Goals:**

- No changes to route structure, navigation behavior, or route definitions
- No changes to the public URL or routing configuration
- No upgrades to React Router version (staying on v7.14.x)

## Decisions

### Decision 1: Use `react-router/dom` subpath for browser-specific APIs

**Choice:** Import `createBrowserRouter` and `RouterProvider` from `react-router/dom`; all other APIs from `react-router` root.

**Rationale:** React Router v7 exposes browser-specific entry points via `react-router/dom`. In a browser app, `createBrowserRouter` and `RouterProvider` belong there. All other APIs (`Navigate`, `Outlet`, `Link`, hooks) are exported from the root `react-router` package. This matches the official v7 migration guidance.

**Alternatives considered:**

- Import everything from `react-router` root — would work for most APIs, but `createBrowserRouter` and the browser `RouterProvider` are only available under `/dom`.

### Decision 2: Migrate tests to data-router pattern

**Choice:** Replace all `<MemoryRouter>/<Routes>/<Route>` test patterns with `createMemoryRouter` + `RouterProvider`, matching the existing `renderWithProviders` helper.

**Rationale:** The project already uses the data-router pattern in production (`main.tsx`) and in `render-helpers.tsx`. Maintaining two patterns in tests adds inconsistency and confusion. The data-router API is required for `useBlocker` (used in `setup-wizard.tsx`), so tests wrapping that component must use `createMemoryRouter` anyway.

**Alternatives considered:**

- Keep legacy patterns in tests — possible but increases inconsistency and risks subtle behavioral differences between data-router and component-router.

### Decision 3: No spec behavior changes

**Choice:** This change is purely an import-source swap and test-pattern clarification. No requirements in `openspec/specs/app-shell/spec.md` need modification because the observable behavior is unchanged.

**Rationale:** The route structure, navigation behavior, and redirects all remain identical. Only the import source and test infrastructure change.

## Risks / Trade-offs

- **[Import path mistake]** → Verify every import by running `pnpm build` (TypeScript) and `pnpm test` after migration. The type checker will catch any missing exports.
- **[Test behavior drift]** → Migrating from `<MemoryRouter>` to `createMemoryRouter` may surface subtle differences in how routes are matched or how navigation works. Mitigate by running the full test suite and verifying no test semantics change.
- **[react-router-dom cache in pnpm store]** → After removing all imports, run `pnpm install` to prune the package from `node_modules`. Verify with `ls node_modules/react-router-dom` that it is gone.

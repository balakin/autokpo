## Why

React Router v7 ships routing logic in `react-router`; the `react-router-dom` entry point is now a thin re-export wrapper with no added value. The project already declares `react-router` as a direct dependency but all imports still reference `react-router-dom`, creating an unnecessary indirection and a misleading dependency graph.

## What Changes

- Replace every `import … from 'react-router-dom'` with the equivalent import from `react-router` (or `react-router/dom` for browser-specific APIs like `createBrowserRouter` and `RouterProvider`)
- Remove `react-router-dom` from `node_modules` (it is already absent from `package.json`)
- Unify test utilities: migrate remaining `<MemoryRouter>/<Routes>/<Route>` patterns to `createMemoryRouter` + `RouterProvider`

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `app-shell`: routing imports change from `react-router-dom` to `react-router`; route definition pattern unchanged

## Impact

- **Source files** — 9 production files and ~10 test files update import paths
- **Dependencies** — `react-router-dom` removed from `node_modules` (already absent from `package.json`)
- **No API or behavior changes** — all imported APIs remain the same; only the import source changes
- **Tests** — legacy `<MemoryRouter>/<Routes>/<Route>` patterns in 5 test files should be migrated to the data-router pattern already used in `renderWithProviders`

## MODIFIED Requirements

### Requirement: Test utilities use data-router pattern consistently

All test files that render components depending on React Router SHALL use `createMemoryRouter` + `RouterProvider` from `react-router` (or `react-router/dom`), matching the data-router pattern used in production code. The legacy `<MemoryRouter>`, `<Routes>`, and `<Route>` component-based test patterns SHALL be replaced.

#### Scenario: Test file uses createMemoryRouter instead of MemoryRouter

- **WHEN** a test file needs to wrap a component with a router
- **THEN** the test SHALL use `createMemoryRouter` and `RouterProvider` rather than `<MemoryRouter>`, `<Routes>`, and `<Route>`

#### Scenario: renderWithProviders continues to provide router context

- **WHEN** a test uses `renderWithProviders` from `tests/render-helpers.tsx`
- **THEN** it SHALL continue to provide React Router context via `createMemoryRouter` and `RouterProvider` imported from `react-router` and `react-router/dom`

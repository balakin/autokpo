## 1. Production code — replace react-router-dom imports

- [x] 1.1 Update `src/main.tsx`: change `import … from 'react-router-dom'` to import from `react-router`
- [x] 1.2 Update `src/app-shell/app-shell.tsx`: change imports to `react-router` (Outlet, useNavigate)
- [x] 1.3 Update `src/app-shell/top-bar.tsx`: change imports to `react-router` (useLocation, useParams)
- [x] 1.4 Update `src/app-shell/sidebar.tsx`: change imports to `react-router` (Link, useLocation)
- [x] 1.5 Update `src/books/book-scope.tsx`: change imports to `react-router` (Navigate, useParams)
- [x] 1.6 Update `src/books/book-library.tsx`: change imports to `react-router` (Link)
- [x] 1.7 Update `src/books/add-book-modal.tsx`: change imports to `react-router` (useNavigate)
- [x] 1.8 Update `src/dashboard/dashboard-page.tsx`: change imports to `react-router` (Link)
- [x] 1.9 Update `src/setup-wizard/setup-wizard.tsx`: change imports to `react-router` (useBlocker)
- [x] 1.10 Verify no remaining `react-router-dom` imports in production code (`grep -r "react-router-dom" src/`)

## 2. Test helpers — update render-helpers

- [x] 2.1 Update `tests/render-helpers.tsx`: change `createMemoryRouter`, `RouterProvider` imports from `react-router-dom` to `react-router`

## 3. Test files — migrate legacy router patterns

- [x] 3.1 Update `src/books/__tests__/add-book-modal.spec.tsx`: replace `<MemoryRouter>`, `<Routes>`, `<Route>` with `createMemoryRouter` + `RouterProvider`
- [x] 3.2 Update `src/books/__tests__/book-library.spec.tsx`: replace `<MemoryRouter>`, `<Routes>`, `<Route>` with `createMemoryRouter` + `RouterProvider`
- [x] 3.3 Update `src/books/__tests__/book-scope.spec.tsx`: update `createMemoryRouter`/`RouterProvider` imports from `react-router-dom` to `react-router`
- [x] 3.4 Update `src/app-shell/__tests__/app-shell.spec.tsx`: replace `<MemoryRouter>` with `createMemoryRouter` + `RouterProvider`
- [x] 3.5 Update `src/app-shell/__tests__/sidebar-stats.spec.tsx`: replace `<MemoryRouter>` with `createMemoryRouter` + `RouterProvider`
- [x] 3.6 Update `src/books/__tests__/books-provider.spec.tsx`: replace `<MemoryRouter>` with `createMemoryRouter` + `RouterProvider`
- [x] 3.7 Update `src/working-layout/__tests__/working-layout.spec.tsx`: remove `<Routes>`, `<Route>` and pass component directly to `renderWithProviders`
- [x] 3.8 Update `src/setup-wizard/__tests__/setup-wizard.spec.tsx`: remove `<Routes>`, `<Route>` and pass component directly to `renderWithProviders`

## 4. Cleanup & verification

- [x] 4.1 Run `pnpm -s build` and verify TypeScript compiles with no errors
- [x] 4.2 Run `pnpm -s test` and verify all tests pass
- [x] 4.3 Run `grep -r "react-router-dom" src/ tests/` to confirm zero remaining imports
- [x] 4.4 Run `pnpm install` to prune `react-router-dom` from `node_modules`; verify with `ls node_modules/react-router-dom` that it is absent
- [x] 4.5 Run `pnpm -s lint:fix` to fix any import-ordering issues introduced by the migration

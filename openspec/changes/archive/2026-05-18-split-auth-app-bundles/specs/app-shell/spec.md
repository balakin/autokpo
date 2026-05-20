## MODIFIED Requirements

### Requirement: AppShell wraps all routes with shared layout

The system SHALL render an `AppShell` component inside the lazy signed-in application shell for all signed-in application routes. The AppShell SHALL contain a sidebar, a mobile drawer, a top bar, and a content area rendered via `<Outlet />`. The AppShell SHALL continue to render child route content correctly when it is loaded behind a lazy signed-in application boundary.

#### Scenario: All signed-in pages render inside AppShell

- **WHEN** a signed-in user navigates to any valid signed-in route
- **THEN** the page content SHALL render inside the AppShell's content area via `<Outlet />`

#### Scenario: AppShell remains visible during child route loading

- **WHEN** a signed-in child route is loading
- **THEN** the AppShell sidebar, mobile drawer, and top bar SHALL remain visible
- **AND** the content area SHALL show a route-loading fallback

#### Scenario: Lazy signed-in shell renders child route outlet

- **WHEN** the signed-in application shell finishes loading for an authenticated user
- **THEN** the AppShell SHALL render the matched child route through its `<Outlet />`

#### Scenario: Lazy signed-in shell fallback resembles app chrome

- **WHEN** the signed-in application shell chunk is loading for an authenticated user
- **THEN** the system SHALL show a shell-shaped loading fallback instead of signed-out auth UI

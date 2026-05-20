## ADDED Requirements

### Requirement: AppShell wraps all routes with shared layout

The system SHALL render an `AppShell` component as a React Router layout route that wraps all application routes. The AppShell SHALL contain a sidebar, a top bar, and a content area rendered via `<Outlet />`. The `BooksProvider` SHALL wrap the entire router.

#### Scenario: All pages render inside AppShell

- **WHEN** the user navigates to any valid route
- **THEN** the page content SHALL render inside the AppShell's content area via `<Outlet />`

#### Scenario: AppShell persists across route changes

- **WHEN** the user navigates between routes
- **THEN** the sidebar and top bar SHALL remain mounted and not re-render

---

### Requirement: Sidebar provides persistent navigation

The system SHALL render a left sidebar with the "КПО" logo text, three navigation items, and a version badge in the footer. The sidebar SHALL be 240px wide on desktop and rendered as a HeroUI Drawer on mobile.

#### Scenario: Desktop sidebar is always visible

- **WHEN** the viewport width is at or above the `lg` breakpoint
- **THEN** the sidebar SHALL be visible at 240px width alongside the content area

#### Scenario: Mobile sidebar opens as a drawer

- **WHEN** the viewport width is below the `lg` breakpoint
- **THEN** the sidebar SHALL be hidden by default and a hamburger menu button SHALL appear in the top bar
- **AND** pressing the hamburger button SHALL open a HeroUI Drawer with the sidebar content

#### Scenario: Sidebar navigation items

- **WHEN** the sidebar is rendered
- **THEN** it SHALL display three items: "Panel" (icon: LuLayoutDashboard, route: /dashboard), "Knjige" (icon: LuBook, route: /books), "Podešavanja" (icon: LuSettings, route: /settings)

#### Scenario: Active navigation item is highlighted

- **WHEN** the user is on a route matching a sidebar item's route
- **THEN** that sidebar item SHALL display a visual active indicator (teal accent glow)

#### Scenario: Sidebar logo

- **WHEN** the sidebar is rendered
- **THEN** the "КПО" text SHALL appear at the top of the sidebar

#### Scenario: Version badge in sidebar footer

- **WHEN** the sidebar is rendered
- **THEN** a version badge with gold accent SHALL appear at the bottom of the sidebar

---

### Requirement: Sidebar uses constant dark theme

The sidebar SHALL use a constant dark background (`oklch(0.15 0.01 270)`) in both light and dark application modes. Text SHALL use light foreground colors. The active navigation item SHALL use the teal accent color with a subtle glow effect.

#### Scenario: Light mode sidebar appearance

- **WHEN** the application is in light mode
- **THEN** the sidebar background SHALL be dark charcoal and the content area SHALL be warm cream

#### Scenario: Dark mode sidebar appearance

- **WHEN** the application is in dark mode
- **THEN** the sidebar background SHALL be the same dark charcoal as in light mode and the content area SHALL be deep navy

---

### Requirement: Top bar provides breadcrumbs and context actions

The system SHALL render a top bar inside the content area containing breadcrumbs and context-specific action buttons. The breadcrumbs SHALL reflect the current route hierarchy.

#### Scenario: Breadcrumbs on dashboard

- **WHEN** the user is on the `/dashboard` route
- **THEN** the top bar SHALL display the breadcrumb "Panel"

#### Scenario: Breadcrumbs on book library

- **WHEN** the user is on the `/books` route
- **THEN** the top bar SHALL display the breadcrumb "Knjige"

#### Scenario: Breadcrumbs on a specific book

- **WHEN** the user is on the `/books/:bookId` route for a book with year 2024
- **THEN** the top bar SHALL display the breadcrumbs "Knjige › 2024"

#### Scenario: Breadcrumbs on settings

- **WHEN** the user is on the `/settings` route
- **THEN** the top bar SHALL display the breadcrumb "Podešavanja"

#### Scenario: Mobile hamburger button

- **WHEN** the viewport width is below the `lg` breakpoint
- **THEN** a hamburger menu button (LuMenu icon) SHALL appear in the top bar
- **AND** pressing it SHALL open the sidebar drawer

---

### Requirement: Route structure uses layout route with redirect

The system SHALL define a React Router layout route at the AppShell level. The root route `/` SHALL redirect to `/dashboard`. Routes SHALL be: `/dashboard`, `/books`, `/books/:bookId`, `/settings`. Unknown routes SHALL redirect to `/dashboard`.

#### Scenario: Root URL redirects to dashboard

- **WHEN** the user navigates to `/`
- **THEN** the application SHALL redirect to `/dashboard` and render the Dashboard page

#### Scenario: Unknown routes redirect to dashboard

- **WHEN** the user navigates to a URL that does not match any defined route
- **THEN** the application SHALL redirect to `/dashboard`

#### Scenario: Book library renders at /books

- **WHEN** the user navigates to `/books`
- **THEN** the BookLibrary SHALL render inside the AppShell content area

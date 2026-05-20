## Purpose

Define the application shell layout, navigation, breadcrumbs, route structure, and router test utility expectations.
## Requirements
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

### Requirement: Sidebar provides persistent navigation

The system SHALL render a left sidebar with the "AutoKPO" logo text, three navigation items, and a version footer. The sidebar SHALL be 240px wide on desktop and rendered as a full-screen HeroUI Drawer on mobile. The drawer SHALL include a visible close button (× icon) in the top-right corner so users can dismiss it without tapping the backdrop.

All sidebar and nav-item colors SHALL be expressed as Tailwind utility classes using the registered sidebar design tokens (`bg-sidebar-bg`, `text-sidebar-fg`, `text-sidebar-muted`, `border-sidebar-border`, `bg-sidebar-item-hover`, `bg-sidebar-active-bg`, `text-sidebar-active-fg`). No inline `style` props or external CSS class names (`.sidebar-nav-item`, `.sidebar-nav-item--active`) SHALL be used.

#### Scenario: Desktop sidebar is always visible

- **WHEN** the viewport width is at or above the `lg` breakpoint
- **THEN** the sidebar SHALL be visible at 240px width alongside the content area

#### Scenario: Mobile sidebar opens as a full-screen drawer

- **WHEN** the viewport width is below the `lg` breakpoint
- **THEN** the sidebar SHALL be hidden by default and a hamburger menu button SHALL appear in the top bar
- **AND** pressing the hamburger button SHALL open a HeroUI Drawer that fills the full viewport width and height

#### Scenario: Mobile drawer has a close button

- **WHEN** the mobile drawer is open
- **THEN** a close button (× icon) SHALL be visible inside the drawer
- **AND** pressing the close button SHALL dismiss the drawer

#### Scenario: Tapping a nav link closes the mobile drawer

- **WHEN** the mobile drawer is open and the user taps any navigation link
- **THEN** the drawer SHALL close

#### Scenario: Drawer auto-closes when viewport reaches desktop width

- **WHEN** the mobile drawer is open and the browser is resized to at or above the `lg` breakpoint
- **THEN** the drawer SHALL close automatically

#### Scenario: Sidebar navigation items

- **WHEN** the sidebar is rendered
- **THEN** it SHALL display three items: "Panel" (icon: LuLayoutDashboard, route: /dashboard), "Knjige" (icon: LuBook, route: /books), "Podešavanja" (icon: LuSettings, route: /settings/general)
- **AND** each label SHALL be wrapped with Lingui `<Trans>` for i18n support

#### Scenario: Active navigation item is highlighted

- **WHEN** the user is on a route matching a sidebar item's route
- **THEN** that sidebar item SHALL display a visual active indicator using the accent color

#### Scenario: Settings navigation is active for settings child routes

- **WHEN** the user is on `/settings`, `/settings/general`, or `/settings/account`
- **THEN** the Settings sidebar item SHALL display the active navigation state

#### Scenario: Sidebar logo

- **WHEN** the sidebar is rendered
- **THEN** the "AutoKPO" text SHALL appear at the top of the sidebar

#### Scenario: Sidebar navigation includes help item

- **WHEN** the sidebar is rendered
- **THEN** the nav SHALL include a "Pomoć" item (icon: LuCircleHelp, route: /help) anchored below the main nav items via `mt-auto`
- **AND** the help item label SHALL be wrapped with Lingui `<Trans>` for i18n support

#### Scenario: Version footer has version badge and AGPL source link

- **WHEN** the sidebar is rendered
- **THEN** the version footer SHALL display the version badge (HeroUI Chip, `variant="soft"`, `color="success"`) on the left and a compact `AGPL-3.0 · [LuGithub icon]` link to `https://github.com/balakin/autokpo` on the right
- **AND** the link SHALL render without underline decoration
- **AND** the link SHALL open in a new tab

#### Scenario: Version badge shows dev suffix in development mode

- **WHEN** the app runs in Vite development mode (`mode === 'development'`)
- **THEN** the version badge SHALL display the version with a `-dev` suffix (e.g. `v1.2.0-dev`)

---

### Requirement: Mobile drawer closes on navigation

The `Sidebar` component SHALL accept an optional `onNavigate` callback prop. When a nav link is pressed inside the mobile drawer, the drawer SHALL close immediately.

#### Scenario: Tapping a nav link closes the drawer

- **WHEN** the mobile drawer is open and the user taps a navigation link
- **THEN** the drawer SHALL close before or during the route transition

#### Scenario: Desktop sidebar nav links have no close side-effect

- **WHEN** the user clicks a nav link in the desktop sidebar
- **THEN** no drawer-close logic SHALL execute (no `onNavigate` prop is passed)

---

### Requirement: Mobile drawer closes when viewport reaches desktop width

The `AppShell` component SHALL register a `MediaQueryList` change listener using the `lg` breakpoint value read from the Tailwind CSS variable `--breakpoint-lg`. When the viewport width crosses this threshold from narrow to wide, the mobile drawer SHALL be closed automatically.

#### Scenario: Drawer auto-closes on resize to desktop

- **WHEN** the mobile drawer is open and the user resizes the browser window to a width at or above the `lg` breakpoint
- **THEN** the drawer SHALL close automatically without any user interaction

#### Scenario: Drawer stays closed after resize

- **WHEN** the drawer has been closed by a resize event and the user resizes back to mobile width
- **THEN** the drawer SHALL remain closed (it SHALL NOT reopen automatically)

#### Scenario: Breakpoint value is read from Tailwind CSS variable

- **WHEN** the `AppShell` mounts
- **THEN** the media query threshold SHALL be derived from `getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-lg')` rather than a hardcoded pixel value

---

### Requirement: Top bar provides breadcrumbs, context actions, and profile access

The system SHALL render a top bar inside the content area containing breadcrumbs, context-specific action buttons, and a persistent profile avatar button. The profile avatar button SHALL remain the rightmost top bar element on every signed-in route, while contextual actions rendered through `TopBarActionsSlot` SHALL appear to its left. The breadcrumbs SHALL reflect the current route hierarchy. All breadcrumb labels and aria-labels SHALL be translatable via Lingui macros.

#### Scenario: Breadcrumbs on dashboard

- **WHEN** the user is on the `/dashboard` route
- **THEN** the top bar SHALL display the translated equivalent of "Panel"

#### Scenario: Breadcrumbs on book library

- **WHEN** the user is on the `/books` route
- **THEN** the top bar SHALL display the translated equivalent of "Knjige"

#### Scenario: Breadcrumbs on a specific book

- **WHEN** the user is on the `/books/:bookId` route for a book with year 2024
- **THEN** the top bar SHALL display translated breadcrumbs "Knjige › 2024"

#### Scenario: Breadcrumbs on settings tabs

- **WHEN** the user is on `/settings/general` or `/settings/account`
- **THEN** the top bar SHALL display the translated equivalent of "Podešavanja"

#### Scenario: Mobile hamburger button

- **WHEN** the viewport width is below the `lg` breakpoint
- **THEN** a hamburger menu button (LuMenu icon) SHALL appear in the top bar
- **AND** pressing it SHALL open the sidebar drawer
- **AND** the button's aria-label SHALL be a translatable string

#### Scenario: Profile avatar button stays rightmost

- **WHEN** a signed-in user navigates to any route
- **THEN** the top bar SHALL render a persistent profile avatar button at the right edge
- **AND** contextual route actions SHALL render to the left of that profile avatar button

---

### Requirement: Route structure uses layout route with redirect

The system SHALL define signed-in routes under the lazy signed-in application shell. Routes SHALL include `/dashboard`, `/books`, `/books/:bookId`, and a nested Settings route. The Settings route SHALL redirect `/settings` to `/settings/general` and SHALL render child routes `/settings/general` and `/settings/account`. Unknown routes SHALL be handled by the auth-aware catch-all route.

#### Scenario: Root URL uses auth-aware catch-all redirect

- **WHEN** the user navigates to `/`
- **THEN** the auth-aware catch-all route SHALL redirect based on stored session state

#### Scenario: Unknown routes use auth-aware catch-all redirect

- **WHEN** the user navigates to a URL that does not match any defined route
- **THEN** the auth-aware catch-all route SHALL redirect based on stored session state

#### Scenario: Book library renders at /books

- **WHEN** the user navigates to `/books`
- **THEN** the BookLibrary SHALL render inside the AppShell content area

#### Scenario: Settings URL redirects to general settings

- **WHEN** the user navigates to `/settings`
- **THEN** the application SHALL redirect to `/settings/general`

#### Scenario: General settings renders as settings child route

- **WHEN** the user navigates to `/settings/general`
- **THEN** the General settings tab SHALL render inside the Settings layout

#### Scenario: Account settings renders as settings child route

- **WHEN** the user navigates to `/settings/account`
- **THEN** the Account settings tab SHALL render inside the Settings layout

---

### Requirement: Test utilities use data-router pattern consistently

All test files that render components depending on React Router SHALL use `createMemoryRouter` + `RouterProvider` from `react-router` (or `react-router/dom`), matching the data-router pattern used in production code. The legacy `<MemoryRouter>`, `<Routes>`, and `<Route>` component-based test patterns SHALL be replaced.

#### Scenario: Test file uses createMemoryRouter instead of MemoryRouter

- **WHEN** a test file needs to wrap a component with a router
- **THEN** the test SHALL use `createMemoryRouter` and `RouterProvider` rather than `<MemoryRouter>`, `<Routes>`, and `<Route>`

#### Scenario: renderWithProviders continues to provide router context

- **WHEN** a test uses `renderWithProviders` from `tests/render-helpers.tsx`
- **THEN** it SHALL continue to provide React Router context via `createMemoryRouter` and `RouterProvider` imported from `react-router` and `react-router/dom`

### Requirement: Route structure includes /help

The signed-in route tree SHALL include a `/help` route that renders the lazy-loaded `HelpPage` component inside the AppShell content area.

#### Scenario: /help renders inside AppShell

- **WHEN** a signed-in user navigates to `/help`
- **THEN** the `HelpPage` SHALL render inside the AppShell content area via `<Outlet />`


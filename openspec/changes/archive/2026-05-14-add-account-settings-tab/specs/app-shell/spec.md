## MODIFIED Requirements

### Requirement: Sidebar provides persistent navigation

The system SHALL render a left sidebar with the "AutoKPO" logo text, three navigation items, and a version badge in the footer. The sidebar SHALL be 240px wide on desktop and rendered as a full-screen HeroUI Drawer on mobile. The drawer SHALL include a visible close button (× icon) in the top-right corner so users can dismiss it without tapping the backdrop.

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

#### Scenario: Version badge in sidebar footer

- **WHEN** the sidebar is rendered
- **THEN** a HeroUI Chip component with `variant="soft"` and `color="success"` SHALL appear at the bottom of the sidebar displaying the current version string

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

### Requirement: Route structure uses layout route with redirect

The system SHALL define a React Router layout route at the AppShell level. The root route `/` SHALL redirect to `/dashboard`. Routes SHALL include `/dashboard`, `/books`, `/books/:bookId`, and a nested Settings route. The Settings route SHALL redirect `/settings` to `/settings/general` and SHALL render child routes `/settings/general` and `/settings/account`. Unknown routes SHALL redirect to `/dashboard`.

#### Scenario: Root URL redirects to dashboard

- **WHEN** the user navigates to `/`
- **THEN** the application SHALL redirect to `/dashboard` and render the Dashboard page

#### Scenario: Unknown routes redirect to dashboard

- **WHEN** the user navigates to a URL that does not match any defined route
- **THEN** the application SHALL redirect to `/dashboard`

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

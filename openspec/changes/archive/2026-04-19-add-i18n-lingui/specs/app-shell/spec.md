## MODIFIED Requirements

### Requirement: Sidebar provides persistent navigation

The system SHALL render a left sidebar with the "KPO" logo text, three navigation items, and a version badge in the footer. The sidebar SHALL be 240px wide on desktop and rendered as a full-screen HeroUI Drawer on mobile. The drawer SHALL include a visible close button (× icon) in the top-right corner so users can dismiss it without tapping the backdrop.

All sidebar and nav-item colors SHALL be expressed as Tailwind utility classes using the registered sidebar design tokens (`bg-sidebar-bg`, `text-sidebar-fg`, `text-sidebar-muted`, `border-sidebar-border`, `bg-sidebar-item-hover`, `bg-sidebar-active-bg`, `text-sidebar-active-fg`). No inline `style` props or external CSS class names (`.sidebar-nav-item`, `.sidebar-nav-item--active`) SHALL be used.

Navigation item labels and aria-labels SHALL be translatable via Lingui macros.

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
- **THEN** it SHALL display three items with translatable labels: "Panel" (icon: LuLayoutDashboard, route: /dashboard), "Knjige" (icon: LuBook, route: /books), "Podešavanja" (icon: LuSettings, route: /settings)
- **AND** each label SHALL be wrapped with Lingui `<Trans>` for i18n support

#### Scenario: Active navigation item is highlighted

- **WHEN** the user is on a route matching a sidebar item's route
- **THEN** that sidebar item SHALL display a visual active indicator using the accent color

#### Scenario: Sidebar logo

- **WHEN** the sidebar is rendered
- **THEN** the "KPO" text SHALL appear at the top of the sidebar

#### Scenario: Version badge in sidebar footer

- **WHEN** the sidebar is rendered
- **THEN** a HeroUI Chip component with `variant="soft"` and `color="success"` SHALL appear at the bottom of the sidebar displaying the current version string

---

### Requirement: Top bar provides breadcrumbs and context actions

The system SHALL render a top bar inside the content area containing breadcrumbs and context-specific action buttons. The breadcrumbs SHALL reflect the current route hierarchy. All breadcrumb labels and aria-labels SHALL be translatable via Lingui macros.

#### Scenario: Breadcrumbs on dashboard

- **WHEN** the user is on the `/dashboard` route
- **THEN** the top bar SHALL display the translated equivalent of "Panel"

#### Scenario: Breadcrumbs on book library

- **WHEN** the user is on the `/books` route
- **THEN** the top bar SHALL display the translated equivalent of "Knjige"

#### Scenario: Breadcrumbs on a specific book

- **WHEN** the user is on the `/books/:bookId` route for a book with year 2024
- **THEN** the top bar SHALL display translated breadcrumbs "Knjige › 2024"

#### Scenario: Breadcrumbs on settings

- **WHEN** the user is on the `/settings` route
- **THEN** the top bar SHALL display the translated equivalent of "Podešavanja"

#### Scenario: Mobile hamburger button

- **WHEN** the viewport width is below the `lg` breakpoint
- **THEN** a hamburger menu button (LuMenu icon) SHALL appear in the top bar
- **AND** pressing it SHALL open the sidebar drawer
- **AND** the button's aria-label SHALL be a translatable string

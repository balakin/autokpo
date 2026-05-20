## MODIFIED Requirements

### Requirement: Sidebar provides persistent navigation

The system SHALL render a left sidebar with the "KPO" logo text, three navigation items, and a version badge in the footer. The sidebar SHALL be 240px wide on desktop and rendered as a full-screen HeroUI Drawer on mobile. The drawer SHALL include a visible close button (× icon) in the top-right corner so users can dismiss it without tapping the backdrop.

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
- **THEN** it SHALL display three items: "Panel" (icon: LuLayoutDashboard, route: /dashboard), "Knjige" (icon: LuBook, route: /books), "Podešavanja" (icon: LuSettings, route: /settings)

#### Scenario: Active navigation item is highlighted

- **WHEN** the user is on a route matching a sidebar item's route
- **THEN** that sidebar item SHALL display a visual active indicator using the accent color

#### Scenario: Sidebar logo

- **WHEN** the sidebar is rendered
- **THEN** the "KPO" text SHALL appear at the top of the sidebar

#### Scenario: Version badge in sidebar footer

- **WHEN** the sidebar is rendered
- **THEN** a HeroUI Chip component with `variant="soft"` and `color="success"` SHALL appear at the bottom of the sidebar displaying the current version string

## ADDED Requirements

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

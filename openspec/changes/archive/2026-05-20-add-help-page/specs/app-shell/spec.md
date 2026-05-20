## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Route structure includes /help

The signed-in route tree SHALL include a `/help` route that renders the lazy-loaded `HelpPage` component inside the AppShell content area.

#### Scenario: /help renders inside AppShell

- **WHEN** a signed-in user navigates to `/help`
- **THEN** the `HelpPage` SHALL render inside the AppShell content area via `<Outlet />`

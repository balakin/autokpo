## MODIFIED Requirements

### Requirement: Sidebar provides persistent navigation

The system SHALL render a left sidebar with the "KPO" logo text, three navigation items, and a version badge in the footer. The sidebar SHALL be 240px wide on desktop and rendered as a full-screen HeroUI Drawer on mobile. The drawer SHALL include a visible close button (× icon) in the top-right corner so users can dismiss it without tapping the backdrop.

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

---

## REMOVED Requirements

### Requirement: Sidebar uses constant dark theme

**Reason**: Replaced by theme-aware sidebar colors defined in the design-tokens system. The sidebar now adapts to the active light/dark mode instead of always using a dark charcoal background.

**Migration**: Sidebar colors are now controlled by `--sidebar-*` CSS custom properties defined separately for `:root` (light) and `[data-theme='dark']` (dark). Remove any hardcoded dark sidebar color overrides.

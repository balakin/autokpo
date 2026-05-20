## ADDED Requirements

### Requirement: Arctic color token system defines the full visual palette

The system SHALL define all color, shadow, and semantic design tokens as CSS custom properties in `src/index.css`. Light mode tokens SHALL be set on `:root`. Dark mode tokens SHALL be set on `.dark, [data-theme='dark']`. All color values SHALL use the `oklch` color space.

#### Scenario: Light mode tokens are active by default

- **WHEN** no `data-theme` attribute or `.dark` class is present on the document
- **THEN** the application SHALL render using the light mode arctic palette (soft blue-gray backgrounds, dark foreground text)

#### Scenario: Dark mode tokens override light mode

- **WHEN** the document has `data-theme='dark'` or the `.dark` class applied
- **THEN** the application SHALL render using the dark mode arctic palette (deep blue-gray backgrounds, light foreground text)

---

### Requirement: Token set covers surfaces, text, semantic states, components, and shadows

The token system SHALL define the following categories of custom properties:

- **Surfaces**: `--background`, `--surface`, `--surface-secondary`, `--overlay`
- **Foregrounds**: `--foreground`, `--surface-foreground`, `--surface-secondary-foreground`, `--overlay-foreground`
- **Text hierarchy**: `--muted`, `--scrollbar`
- **Accent**: `--accent`, `--accent-foreground`, `--accent-soft`, `--accent-soft-foreground`
- **Semantic**: `--success`, `--success-foreground`, `--danger`, `--danger-foreground`, `--warning`, `--warning-foreground`
- **Default action**: `--default`, `--default-foreground`
- **Component**: `--segment`, `--segment-foreground`
- **Borders**: `--border`, `--separator`, `--focus`, `--link`
- **Form fields**: `--field-background`, `--field-foreground`, `--field-placeholder`, `--field-border`
- **Shadows**: `--surface-shadow`, `--overlay-shadow`, `--field-shadow`
- **Backdrop**: `--backdrop`

#### Scenario: All token categories are defined in both modes

- **WHEN** the application switches between light and dark mode
- **THEN** every token listed above SHALL resolve to a valid color value in each mode

---

### Requirement: Sidebar tokens are exposed to Tailwind via @theme inline

The sidebar color tokens (`--sidebar-bg`, `--sidebar-fg`, `--sidebar-muted`, `--sidebar-border`, `--sidebar-item-hover`, `--sidebar-active-fg`, `--sidebar-active-bg`) and `--accent-soft` SHALL be registered in `@theme inline` so they are available as Tailwind utility classes.

#### Scenario: Tailwind sidebar utilities are generated

- **WHEN** Tailwind processes `src/index.css`
- **THEN** utilities such as `bg-sidebar-bg`, `text-sidebar-fg`, `border-sidebar-border` SHALL be available for use in component classes

---

### Requirement: Sidebar uses theme-aware colors

The sidebar SHALL adapt its background and foreground colors to the active application theme. In light mode the sidebar SHALL use a muted blue-gray surface slightly darker than the main background. In dark mode it SHALL use a surface slightly lighter than the main background.

#### Scenario: Light mode sidebar appearance

- **WHEN** the application is in light mode
- **THEN** the sidebar background SHALL be `oklch(0.935 0.008 240)` and text SHALL use dark foreground colors

#### Scenario: Dark mode sidebar appearance

- **WHEN** the application is in dark mode
- **THEN** the sidebar background SHALL be `oklch(0.18 0.015 255)` and text SHALL use light foreground colors

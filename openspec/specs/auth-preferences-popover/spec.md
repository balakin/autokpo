## Requirements

### Requirement: Auth shell header shows a gear icon button

The auth shell SHALL render a gear icon button (`LuSettings`) in its header, positioned at the right edge. The header SHALL use `flex items-center justify-between` layout, matching the encryption shell header structure. The gear button SHALL be an icon-only HeroUI `Button` with `variant="ghost"` and `size="md"`. The button SHALL have a translatable `aria-label`.

#### Scenario: Gear button is visible on auth pages

- **WHEN** a signed-out user visits any auth page that uses `AuthShell`
- **THEN** a gear icon button SHALL be visible in the top-right area of the header
- **AND** the button SHALL have an accessible name

#### Scenario: No inline selects in auth header

- **WHEN** the auth shell renders
- **THEN** there SHALL NOT be any inline `<Select>` components directly in the header
- **AND** the header SHALL contain only the logo text and the gear button

---

### Requirement: Gear button opens Popover on desktop

When the viewport width is at or above the `lg` breakpoint, pressing the gear button SHALL open a HeroUI `Popover` positioned at `bottom end` relative to the button. The Popover SHALL contain language and theme select controls.

#### Scenario: Desktop popover opens on button press

- **WHEN** the viewport is at or above the `lg` breakpoint
- **AND** the user presses the gear button
- **THEN** a Popover SHALL open below and aligned to the right edge of the button

#### Scenario: Desktop popover closes on outside click

- **WHEN** the popover is open on desktop
- **AND** the user clicks outside the popover
- **THEN** the popover SHALL close

#### Scenario: Desktop popover closes on selecting a preference

- **WHEN** the popover is open on desktop
- **AND** the user selects a language or theme option
- **THEN** the popover SHALL close

---

### Requirement: Gear button opens Drawer on mobile

When the viewport width is below the `lg` breakpoint, pressing the gear button SHALL open a HeroUI `Drawer` that slides in from the right edge. The Drawer SHALL fill the full viewport width and have a visible close button (X icon) in its header bar. The mobile Drawer surface SHALL be safe-area aware: its background SHALL extend through iOS unsafe/dead-zone regions, and its heading/content controls SHALL be padded away from unsafe screen edges.

#### Scenario: Mobile drawer opens on button press

- **WHEN** the viewport is below the `lg` breakpoint
- **AND** the user presses the gear button
- **THEN** a Drawer SHALL open from the right edge filling the screen width

#### Scenario: Mobile drawer has a heading and close button

- **WHEN** the mobile drawer is open
- **THEN** a heading bar with "Podešavanja" text SHALL be visible at the top
- **AND** a close button (X icon with label "Zatvori") SHALL be visible in the heading bar
- **AND** pressing the close button SHALL dismiss the drawer

#### Scenario: Mobile drawer closes on selecting a preference

- **WHEN** the mobile drawer is open
- **AND** the user selects a language or theme option
- **THEN** the drawer SHALL close

#### Scenario: Mobile drawer owns safe-area background

- **WHEN** the mobile preferences drawer is open on a device with non-zero safe-area insets
- **THEN** the drawer surface background SHALL fill unsafe/dead-zone regions instead of exposing the page or theme-color background
- **AND** the heading, close button, and preference controls SHALL remain inside the safe content area

---

### Requirement: Language and theme selects with visible labels

The popover/drawer SHALL contain a language select (Jezik) and a theme select (Tema), each with a visible `<Label>` (not `sr-only`). The selects SHALL use the same `Select` + `ListBox` pattern from the existing `EncryptionProfilePopover`. The language options SHALL list all available locales from `LOCALES` using their display names. The theme options SHALL list "Svetla" (light), "Tamna" (dark), and "Sistemska" (system).

#### Scenario: Language select shows available locales

- **WHEN** the popover or drawer is open
- **THEN** a language select with visible label "Jezik" SHALL be present
- **AND** expanding the select SHALL show all available locale display names

#### Scenario: Theme select shows three options

- **WHEN** the popover or drawer is open
- **THEN** a theme select with visible label "Tema" SHALL be present
- **AND** expanding the select SHALL show Svetla, Tamna, and Sistemska options

#### Scenario: Selecting a language changes the locale immediately

- **WHEN** the user selects a different language from the popover or drawer
- **THEN** the application locale SHALL update immediately
- **AND** the auth page SHALL re-render with the new locale

#### Scenario: Selecting a theme changes the theme immediately

- **WHEN** the user selects a different theme from the popover or drawer
- **THEN** the active theme SHALL update immediately
- **AND** the preference SHALL be persisted through the existing theme preference storage

---

### Requirement: Desktop popover width is 240px

The desktop `Popover.Content` SHALL have a width of `w-60` (240px). This is narrower than the profile popover (`w-72` / 288px) because it contains only two selects without a profile section.

#### Scenario: Desktop popover has correct width

- **WHEN** the popover is open on desktop
- **THEN** the popover SHALL be 240px wide

---

### Requirement: Social OAuth buttons stack vertically on mobile

On the sign-in page (`auth-entry.tsx`), the container for OAuth provider buttons SHALL use responsive flex layout: stacked vertically (`flex-col`) on screens below the `sm` breakpoint (640px), and side-by-side (`flex-row`) on `sm` and above. Both buttons SHALL use `fullWidth`.

#### Scenario: Social buttons stack on narrow viewports

- **WHEN** the viewport width is below 640px (less than `sm`)
- **THEN** the Google and GitHub sign-in buttons SHALL be stacked vertically, each at full card width

#### Scenario: Social buttons sit side-by-side on wider viewports

- **WHEN** the viewport width is at or above 640px (`sm` breakpoint)
- **THEN** the Google and GitHub sign-in buttons SHALL be side-by-side in a row

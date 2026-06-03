## MODIFIED Requirements

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

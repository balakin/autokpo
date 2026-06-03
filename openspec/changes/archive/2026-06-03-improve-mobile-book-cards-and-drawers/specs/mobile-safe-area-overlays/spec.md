## ADDED Requirements

### Requirement: Full-screen mobile overlay surfaces respect safe areas

The system SHALL provide a reusable safe-area-aware pattern for full-screen mobile overlay surfaces. When a mobile Drawer or equivalent full-screen overlay is open, the overlay surface background SHALL extend through unsafe viewport regions, and the overlay's interactive content SHALL be inset using CSS safe-area environment variables.

#### Scenario: Overlay surface fills unsafe regions

- **WHEN** a full-screen mobile overlay is open on a device with non-zero safe-area insets
- **THEN** the overlay surface background SHALL cover the top, bottom, left, and right unsafe regions
- **AND** the page background or browser theme color SHALL NOT be visible through those regions while the overlay is open

#### Scenario: Overlay content avoids unsafe regions

- **WHEN** a full-screen mobile overlay contains header, body, footer, or close controls
- **THEN** those interactive areas SHALL be padded away from unsafe screen edges using `env(safe-area-inset-*)` or an equivalent reusable CSS abstraction

### Requirement: App viewport enables safe-area painting

The application document SHALL opt into safe-area-aware viewport painting so supported mobile browsers allow the app to extend overlay backgrounds into unsafe areas.

#### Scenario: Viewport meta supports safe-area painting

- **WHEN** the application document is loaded
- **THEN** the viewport meta content SHALL include `viewport-fit=cover`

### Requirement: Mobile account and preferences drawers share safe-area behavior

Signed-in profile, signed-out preferences, and encryption profile/preferences mobile drawers SHALL use the same safe-area-aware full-screen overlay pattern.

#### Scenario: Profile drawer uses safe-area pattern

- **WHEN** a signed-in user opens the profile drawer on a mobile viewport
- **THEN** the drawer surface SHALL fill unsafe regions with its own background
- **AND** profile controls SHALL remain inside the safe content area

#### Scenario: Auth preferences drawer uses safe-area pattern

- **WHEN** a signed-out user opens the preferences drawer on a mobile viewport
- **THEN** the drawer surface SHALL fill unsafe regions with its own background
- **AND** preference controls SHALL remain inside the safe content area

#### Scenario: Encryption profile drawer uses safe-area pattern

- **WHEN** a user opens the encryption profile or preferences drawer on a mobile viewport
- **THEN** the drawer surface SHALL fill unsafe regions with its own background
- **AND** drawer controls SHALL remain inside the safe content area

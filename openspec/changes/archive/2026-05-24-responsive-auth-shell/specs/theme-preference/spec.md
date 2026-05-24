## MODIFIED Requirements

### Requirement: Auth page provides compact theme preference control

The auth page SHALL provide a gear icon button (`LuSettings`) in its page header that opens a theme and language preference panel. On desktop (viewport at or above the `lg` breakpoint), pressing the button SHALL open a `Popover` positioned at `bottom end`. On mobile (viewport below the `lg` breakpoint), pressing the button SHALL open a `Drawer` from the right edge. The panel SHALL contain language and theme selects with visible labels. The theme control SHALL allow choosing light, dark, or system theme and SHALL use the existing `ThemeProvider` state and persistence behavior.

#### Scenario: Signed-out user changes theme from auth header

- **WHEN** a signed-out user opens the preferences panel via the gear button in the auth header
- **AND** selects a theme from the panel
- **THEN** the active theme SHALL update immediately
- **AND** the selected preference SHALL be persisted through the existing theme preference storage
- **AND** the sign-in page SHALL remain on `/sign-in`
- **AND** the panel SHALL close

#### Scenario: Signed-out user changes language from auth header

- **WHEN** a signed-out user opens the preferences panel via the gear button in the auth header
- **AND** selects a language from the panel
- **THEN** the application locale SHALL update immediately
- **AND** the sign-in page SHALL remain on `/sign-in`
- **AND** the panel SHALL close

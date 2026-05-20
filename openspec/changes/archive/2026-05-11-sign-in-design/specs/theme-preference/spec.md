## ADDED Requirements

### Requirement: Auth page provides compact theme preference control

The auth page SHALL provide a compact theme preference control in its page header. The control SHALL allow choosing light, dark, or system theme and SHALL use the existing `ThemeProvider` state and persistence behavior.

#### Scenario: Signed-out user changes theme from auth header

- **WHEN** a signed-out user selects a theme from the auth page header control
- **THEN** the active theme SHALL update immediately
- **AND** the selected preference SHALL be persisted through the existing theme preference storage
- **AND** the sign-in page SHALL remain on `/sign-in`

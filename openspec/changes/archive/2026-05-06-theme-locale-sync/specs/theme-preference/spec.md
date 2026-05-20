## ADDED Requirements

### Requirement: ThemeProvider is mounted above the router

The system SHALL render `ThemeProvider` above the router, outside `AuthProvider`, so that the active theme applies to both the auth page and the signed-in application. `ThemeProvider` SHALL NOT be rendered inside `SignedInApp`.

#### Scenario: Auth page receives active theme

- **WHEN** the user opens the application while signed out
- **THEN** the `<html>` element SHALL already have the correct theme class applied
- **AND** the auth page SHALL render with the user's stored theme preference

### Requirement: Theme syncs across open tabs via storage event

The system SHALL add a `storage` event listener in `ThemeProvider` that reacts to changes to the `autokpo:theme` key in `localStorage`. When another tab writes a new theme preference, the listening tab SHALL update its state and re-apply the theme to the DOM.

#### Scenario: Theme change in one tab propagates to other tabs

- **WHEN** the user changes the theme preference in one browser tab
- **THEN** all other open tabs SHALL update to the new theme within one event loop tick
- **AND** the `<html>` element in each tab SHALL reflect the new theme class

#### Scenario: storage event for unrelated key is ignored

- **WHEN** a `storage` event fires for a key other than `autokpo:theme`
- **THEN** `ThemeProvider` SHALL NOT update its state or re-apply the DOM theme

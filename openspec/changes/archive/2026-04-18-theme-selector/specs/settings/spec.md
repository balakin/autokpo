## MODIFIED Requirements

### Requirement: Settings page displays configuration sections

The system SHALL render a Settings page at `/settings` with sections for Theme, Language, and Data. The Language and Data sections SHALL be markup-only placeholders. The Theme section SHALL contain a functional theme selector.

#### Scenario: Settings page renders with all sections

- **WHEN** the user navigates to `/settings`
- **THEN** the page SHALL display sections labeled "Tema", "Jezik", and "Podaci"

#### Scenario: Theme section contains a Select control

- **WHEN** the settings page is rendered
- **THEN** the Theme section SHALL display a `Select` component with options for "Svetla" (light), "Tamna" (dark), and "Sistemska" (system)
- **AND** the Select SHALL show the currently active preference as its selected value
- **AND** the default selected value SHALL be "Sistemska" when no preference has been stored

#### Scenario: Selecting a theme updates the active theme

- **WHEN** the user selects an option from the theme Select
- **THEN** the active theme SHALL change immediately
- **AND** the preference SHALL be persisted to localStorage

#### Scenario: Data section placeholder

- **WHEN** the settings page is rendered
- **THEN** the Data section SHALL display placeholders for export, import, and clear data actions with no functional behavior

#### Scenario: No visible page heading

- **WHEN** the settings page is rendered
- **THEN** the page SHALL NOT display a visible icon + heading row at the top
- **AND** the page SHALL contain a visually-hidden `<h1 className="sr-only">Podešavanja</h1>`

---

## REMOVED Requirements

### Requirement: Settings is markup only

**Reason**: The Theme section now has live state management and localStorage persistence.
**Migration**: The Theme section is no longer a placeholder. Language and Data sections remain placeholder-only.

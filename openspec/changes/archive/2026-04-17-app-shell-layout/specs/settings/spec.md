## ADDED Requirements

### Requirement: Settings page displays configuration sections

The system SHALL render a Settings page at `/settings` with sections for Theme, Font, Language, and Data. All sections SHALL be markup-only placeholders with no live logic.

#### Scenario: Settings page renders with all sections

- **WHEN** the user navigates to `/settings`
- **THEN** the page SHALL display sections labeled "Tema", "Font", "Jezik", and "Podaci"

#### Scenario: Theme section placeholder

- **WHEN** the settings page is rendered
- **THEN** the Theme section SHALL display a placeholder for light/dark/system toggle with no functional behavior

#### Scenario: Data section placeholder

- **WHEN** the settings page is rendered
- **THEN** the Data section SHALL display placeholders for export, import, and clear data actions with no functional behavior

---

### Requirement: Settings is markup only

The Settings page SHALL contain no live state management or persistence logic.

#### Scenario: No functional toggles or actions

- **WHEN** the user interacts with any control on the Settings page
- **THEN** no application state SHALL be modified

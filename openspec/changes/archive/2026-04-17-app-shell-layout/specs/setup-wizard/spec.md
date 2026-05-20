## MODIFIED Requirements

### Requirement: Wizard starts at welcome step on first visit

The system SHALL render the welcome step when the active book has neither entity profile nor signature saved (both context values are `null`). The wizard is scoped to the book identified by the current `/books/:bookId` route and renders inside the AppShell content area. The wizard SHALL NOT render its own full-screen page wrapper. The wizard SHALL retain its custom WizardStepper component for step navigation.

#### Scenario: Fresh book with no data

- **WHEN** the user opens a freshly created book at `/books/<id>` (both profile and signature are null)
- **THEN** the setup wizard SHALL display the welcome step inside the AppShell content area
- **AND** the AppShell top bar SHALL show breadcrumbs "Knjige › <year>"

#### Scenario: Welcome step no longer uses full-screen overlay

- **WHEN** the wizard displays the welcome step
- **THEN** the welcome card SHALL render inside the AppShell content area (not as a full-screen centered overlay)

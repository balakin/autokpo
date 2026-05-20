## MODIFIED Requirements

### Requirement: Wizard starts at start step on first visit

The system SHALL render the start (Početak) step as step 0 of the stepper when the active book has neither entity profile nor signature saved (both context values are `null`). The stepper SHALL always be visible and SHALL span the full width of the AppShell content area. Step content SHALL be constrained to `max-w-2xl` and centered horizontally. The `'welcome'` step value is replaced by `'start'`; the file `welcome-step.tsx` is renamed to `start-step.tsx`.

#### Scenario: Fresh book with no data shows start step inside stepper

- **WHEN** the user opens a freshly created book at `/books/<id>` (both profile and signature are null)
- **THEN** the setup wizard SHALL display the start step (Početak) as the active step inside the stepper
- **AND** the stepper SHALL be full-width with no max-width constraint on its container
- **AND** the start step content SHALL be constrained to max-w-2xl and centered

#### Scenario: Start step content lists upcoming steps

- **WHEN** the start step is displayed
- **THEN** its heading SHALL be "Podešavanje knjige" (not a welcome greeting)
- **AND** it SHALL list Profil (podaci o obvezniku) and Potpis (odgovorno lice i sastavljač za PDF)
- **AND** it SHALL include a note that all data can be changed later, displayed at normal text prominence (not small/muted)

#### Scenario: Start step is always non-navigable

- **WHEN** the wizard is in any step
- **THEN** the Početak stepper label SHALL have no click handler and SHALL NOT be clickable

#### Scenario: Returning user with profile skips to signature

- **WHEN** the user opens a book that already has a saved entity profile (profile is not null)
- **THEN** the setup wizard SHALL display the signature step as the active step (unchanged behavior)

### Requirement: Unsaved changes guard

The setup wizard SHALL prevent the user from losing unsaved form edits by blocking step navigation and in-app route changes when a form is dirty. A confirmation dialog SHALL ask the user to confirm or cancel the navigation.

#### Scenario: Stepper navigation blocked when form is dirty

- **WHEN** the user has unsaved changes in the profile or signature form
- **AND** the user clicks a navigable stepper label (e.g. "Profil" from the signature step)
- **THEN** the wizard SHALL NOT navigate immediately
- **AND** it SHALL show the UnsavedChangesDialog with heading "Napustiti stranicu?"

#### Scenario: Confirming the dialog navigates to the target step

- **WHEN** the UnsavedChangesDialog is shown
- **AND** the user clicks "Napustite"
- **THEN** the wizard SHALL navigate to the target step
- **AND** the dialog SHALL be dismissed

#### Scenario: Cancelling the dialog keeps the current step

- **WHEN** the UnsavedChangesDialog is shown
- **AND** the user clicks "Ostanite"
- **THEN** the wizard SHALL remain on the current step
- **AND** the dialog SHALL be dismissed

#### Scenario: Successful form submit advances without dialog

- **WHEN** the user fills the profile form with valid data and submits it
- **THEN** the wizard SHALL advance to the signature step immediately
- **AND** the UnsavedChangesDialog SHALL NOT be shown

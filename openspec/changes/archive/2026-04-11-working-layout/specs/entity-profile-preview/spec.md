## ADDED Requirements

### Requirement: Entity profile preview displays all six fields in read-only mode

The system SHALL render a Card containing all six entity profile fields (PIB, Obveznik, Firma-radnje, Sedište, Šifra poreskog obveznika, Šifra delatnosti) in a read-only data grid. No input fields SHALL be shown in preview mode.

#### Scenario: All fields are visible

- **WHEN** the working layout is active and the entity profile exists
- **THEN** the entity profile preview card SHALL display all six field labels and their corresponding values

---

### Requirement: Entity profile preview card has an "Uredi" button that opens an edit modal

The system SHALL render an "Uredi" button in the entity profile preview card header. Pressing the button SHALL open a modal containing the EntityProfileForm.

#### Scenario: Edit button opens modal

- **WHEN** the user clicks "Uredi" on the entity profile preview card
- **THEN** a modal SHALL appear containing the entity profile form with all six fields pre-populated with the current values

#### Scenario: Modal closes after successful save

- **WHEN** the user submits valid data in the entity profile edit modal
- **THEN** the modal SHALL close and the preview SHALL reflect the updated values

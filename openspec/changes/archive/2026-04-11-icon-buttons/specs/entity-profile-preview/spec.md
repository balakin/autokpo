## MODIFIED Requirements

### Requirement: Entity profile preview card has an "Uredi" button that opens an edit modal

The system SHALL render an icon-only pencil button (`gravity-ui:pencil`) with `aria-label="Uredi"` and a tooltip "Uredi" in the entity profile preview card header. Pressing the button SHALL open a modal containing the EntityProfileForm.

#### Scenario: Edit button opens modal

- **WHEN** the user clicks the edit icon button (aria-label: "Uredi") on the entity profile preview card
- **THEN** a modal SHALL appear containing the entity profile form with all six fields pre-populated with the current values

#### Scenario: Modal closes after successful save

- **WHEN** the user submits valid data in the entity profile edit modal
- **THEN** the modal SHALL close and the preview SHALL reflect the updated values

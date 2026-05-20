## MODIFIED Requirements

### Requirement: Signature preview card has an "Uredi" button that opens an edit modal

The system SHALL render an icon-only pencil button (`FaPencil` from `react-icons/fa6`) with `aria-label="Uredi"` and a tooltip "Uredi" in the signature preview card header. Pressing the button SHALL open a modal containing the SignatureForm.

#### Scenario: Edit button opens modal

- **WHEN** the user clicks the edit icon button (aria-label: "Uredi") on the signature preview card
- **THEN** a modal SHALL appear containing the signature form with both fields pre-populated with the current values

#### Scenario: Modal closes after successful save

- **WHEN** the user submits valid data in the signature edit modal
- **THEN** the modal SHALL close and the preview SHALL reflect the updated values

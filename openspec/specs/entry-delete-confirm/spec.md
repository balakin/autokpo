### Requirement: Entry deletion requires confirmation via modal dialog

The system SHALL present a HeroUI `AlertDialog` confirmation modal when the user initiates deletion of a KPO entry. The deletion SHALL only proceed if the user explicitly confirms inside the modal.

#### Scenario: Confirmation modal opens on delete button press

- **WHEN** the user presses the delete button (aria-label: "Obriši") for an entry in the entries table
- **THEN** an `AlertDialog` modal SHALL open displaying the entry's date and description so the user can identify what will be deleted

#### Scenario: Entry is deleted after confirmation

- **WHEN** the confirmation modal is open and the user presses the "Obriši" confirm button
- **THEN** the modal SHALL close and the entry SHALL be removed from the table and from `localStorage`

#### Scenario: Entry is NOT deleted after cancellation

- **WHEN** the confirmation modal is open and the user presses the "Otkaži" cancel button
- **THEN** the modal SHALL close and the entry SHALL remain in the table unchanged

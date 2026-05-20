## MODIFIED Requirements

### Requirement: User can delete a KPO entry

The system SHALL allow the user to permanently delete an entry from the table. Before deletion, the system SHALL display a HeroUI `AlertDialog` confirmation modal. The deletion SHALL only proceed if the user confirms in the modal.

#### Scenario: Delete confirmation modal opens

- **WHEN** the user clicks the delete action on an entry
- **THEN** an `AlertDialog` modal SHALL open displaying the entry's date and description

#### Scenario: Entry deleted after confirmation

- **WHEN** the user clicks the delete action on an entry and confirms in the modal
- **THEN** the entry SHALL be removed from the table and from `localStorage`

#### Scenario: Entry not deleted on cancellation

- **WHEN** the user clicks the delete action on an entry and cancels in the modal
- **THEN** the entry SHALL remain in the table and `localStorage` SHALL be unchanged

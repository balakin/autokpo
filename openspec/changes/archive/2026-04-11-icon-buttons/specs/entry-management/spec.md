## MODIFIED Requirements

### Requirement: User can add a new KPO entry

The system SHALL allow the user to open an "Add entry" modal form, fill in all required fields, and save the new entry to the table.

#### Scenario: Add entry modal opens

- **WHEN** the user clicks the Add entry icon button (aria-label: "Dodaj unos") in the KPO entries card header
- **THEN** a modal dialog SHALL open containing the entry form with all required fields

#### Scenario: New entry saved successfully

- **WHEN** the user fills in all valid fields and submits the form
- **THEN** the modal SHALL close, the new entry SHALL appear in the entries table, and the entry SHALL be persisted to `localStorage` under `kpo:entries`

#### Scenario: Modal closes after save

- **WHEN** the user successfully saves a new entry
- **THEN** the modal SHALL close and the new entry SHALL appear in the table

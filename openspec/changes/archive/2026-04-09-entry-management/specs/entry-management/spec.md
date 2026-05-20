## ADDED Requirements

### Requirement: Entries table displays all KPO ledger entries

The system SHALL display all stored KPO entries in a table in the order they were added. The table SHALL show the columns: Redni broj (1), Datum i opis knjiženja (2), Od prodaje proizvoda (3), Od izvršenih usluga (4), and Svega (RSD) (3+4, computed). All column labels SHALL be in Serbian.

#### Scenario: Table populated with existing entries

- **WHEN** the user opens the application and entries exist in `localStorage`
- **THEN** the entries table SHALL display all stored entries in the order they were added

#### Scenario: Table shows empty state

- **WHEN** no entries exist in `localStorage`
- **THEN** the entries table SHALL display an empty-state message in Serbian indicating no entries have been added

---

### Requirement: User can add a new KPO entry

The system SHALL allow the user to open an "Add entry" modal form, fill in all required fields, and save the new entry to the table.

#### Scenario: Add entry modal opens

- **WHEN** the user clicks the "Dodaj unos" button
- **THEN** a modal dialog SHALL open containing the entry form with all required fields

#### Scenario: New entry saved successfully

- **WHEN** the user fills in all valid fields and submits the form
- **THEN** the modal SHALL close, the new entry SHALL appear in the entries table, and the entry SHALL be persisted to `localStorage` under `kpo:entries`

#### Scenario: Modal closes after save

- **WHEN** the user successfully saves a new entry
- **THEN** the modal SHALL close and the new entry SHALL appear in the table

---

### Requirement: User can edit an existing KPO entry

The system SHALL allow the user to open an entry's edit form, modify fields, and save the updated entry.

#### Scenario: Edit modal opens with pre-filled values

- **WHEN** the user clicks the edit action on an existing entry
- **THEN** a modal dialog SHALL open with all entry fields pre-populated with the current values

#### Scenario: Entry updated successfully

- **WHEN** the user modifies one or more fields and submits the edit form
- **THEN** the modal SHALL close, the table SHALL reflect the updated values, and `localStorage` SHALL be updated

---

### Requirement: User can delete a KPO entry

The system SHALL allow the user to permanently delete an entry from the table.

#### Scenario: Entry deleted

- **WHEN** the user clicks the delete action on an entry and confirms the action
- **THEN** the entry SHALL be removed from the table and from `localStorage`

---

### Requirement: Datum prometa field validates ISO date format

The system SHALL accept dates entered via a HeroUI DatePicker and validate that the stored value is a valid ISO date string.

#### Scenario: Valid date accepted

- **WHEN** the user selects a date using the date picker
- **THEN** no validation error is shown for the Datum prometa field

#### Scenario: Empty date rejected

- **WHEN** the user submits the form without selecting a date
- **THEN** the form SHALL display "Polje je obavezno" next to the Datum prometa field

---

### Requirement: Amount fields validate non-negative numbers

The system SHALL reject negative values for Od prodaje proizvoda and Od izvršenih usluga. Both fields are required and must contain a non-negative numeric value; either or both may be zero.

#### Scenario: Negative amount rejected

- **WHEN** the user enters a negative number in any amount field and submits
- **THEN** the form SHALL display "Vrednost ne može biti negativna" and SHALL NOT save the entry

#### Scenario: Valid amounts accepted

- **WHEN** the user enters valid non-negative numeric values in both amount fields
- **THEN** no validation errors are shown for amount fields

#### Scenario: Svega computed correctly

- **WHEN** an entry is displayed in the table
- **THEN** the Svega column SHALL show the sum of Od prodaje proizvoda and Od izvršenih usluga

---

### Requirement: All required entry fields must be non-empty

The system SHALL not save an entry if any required field is empty, displaying "Polje je obavezno" next to each empty field.

#### Scenario: Save with empty required fields

- **WHEN** the user attempts to submit the entry form with one or more empty required fields
- **THEN** the system SHALL display "Polje je obavezno" next to each empty field and SHALL NOT close the modal or save the entry

---

### Requirement: Entries are accessible to the rest of the application

The system SHALL expose the entries array via `EntriesContext` so that the PDF export module can consume entries without prop-drilling.

#### Scenario: EntriesContext provides current entries

- **WHEN** the user adds, edits, or deletes an entry
- **THEN** consumers of `EntriesContext` SHALL receive the updated entries array immediately

#### Scenario: EntriesContext provides empty array before first entry

- **WHEN** no entries exist in `localStorage`
- **THEN** `EntriesContext` SHALL provide an empty array

---

### Requirement: Entries persist across page reloads

The system SHALL store all entries in `localStorage` under `kpo:entries` as a JSON array. On application load, the system SHALL restore all entries from storage.

#### Scenario: Entries restored on reload

- **WHEN** the user has previously saved entries and reloads the page
- **THEN** the entries table SHALL display all previously saved entries

#### Scenario: No entries in storage

- **WHEN** the user opens the application for the first time
- **THEN** the entries table SHALL show the empty-state message

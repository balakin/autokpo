## Purpose

Define how KPO entries are created, validated, listed, edited, deleted, and persisted for each book.

## Requirements

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

The system SHALL allow the user to open an "Add entry" modal form, fill in all required fields, and save the new entry to the table. Each amount field SHALL include a currency conversion trigger button (⇄) that opens the currency conversion modal when a transaction date is set, allowing the user to convert a foreign currency amount to RSD before saving.

#### Scenario: Add entry modal opens

- **WHEN** the user clicks the Add entry icon button (aria-label: "Dodaj unos") in the KPO entries card header
- **THEN** a modal dialog SHALL open containing the entry form with all required fields

#### Scenario: New entry saved successfully

- **WHEN** the user fills in all valid fields and submits the form
- **THEN** the modal SHALL close, the new entry SHALL appear in the entries table, and the entry SHALL be persisted to `localStorage` under `kpo:entries`

#### Scenario: Modal closes after save

- **WHEN** the user successfully saves a new entry
- **THEN** the modal SHALL close and the new entry SHALL appear in the table

#### Scenario: Amount field shows currency conversion trigger

- **WHEN** the entry add form is displayed
- **THEN** each amount field suffix SHALL contain a ⇄ icon button alongside the "RSD" label

#### Scenario: Currency conversion trigger not shown in edit form

- **WHEN** the entry edit form is displayed
- **THEN** the amount field suffixes SHALL NOT show the ⇄ currency conversion button (entry is already stored in RSD)

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

---

### Requirement: Datum prometa field validates ISO date format

The system SHALL accept dates entered via a HeroUI DatePicker and validate that the stored value is a valid ISO date string in `YYYY-MM-DD` format that corresponds to a real calendar date. The allowed range is: on or after January 1 of the KPO book year, on or before December 31 of the KPO book year, and not after today in the Europe/Belgrade timezone. The Calendar SHALL enforce this range via `minValue` and `maxValue` props (not `isDateUnavailable`), so that navigation is constrained to the valid range and the calendar opens at the correct year when the book year differs from the current year. The Zod schema SHALL enforce the same range and SHALL additionally reject impossible calendar dates (e.g., February 30) that match the `YYYY-MM-DD` pattern but do not correspond to a real date. When multiple date constraints are violated, year-boundary errors SHALL be reported before the future-date error. Date boundary validation SHALL be implemented using `@internationalized/date` calendar comparisons and SHALL NOT depend on `date-fns`. The `today` value used for validation and calendar bounds SHALL be captured once when the form mounts and SHALL NOT change during the form session.

#### Scenario: Valid date accepted

- **WHEN** the user selects a date using the date picker that is within the book year and not after today
- **THEN** no validation error is shown for the Datum prometa field

#### Scenario: Empty date rejected

- **WHEN** the user submits the form without selecting a date
- **THEN** the form SHALL display "Polje je obavezno" next to the Datum prometa field

#### Scenario: Future date rejected

- **WHEN** the user selects a date after today (Europe/Belgrade timezone) that is still within the book year
- **THEN** the calendar SHALL NOT allow navigation to that date and the schema SHALL reject it with "Datum ne može biti u budućnosti"

#### Scenario: Date before book year rejected

- **WHEN** the user selects a date before January 1 of the current KPO book year
- **THEN** the calendar SHALL NOT allow navigation to that date and the schema SHALL reject it with "Datum mora biti u godini knjige"

#### Scenario: Date after book year rejected

- **WHEN** the user selects a date after December 31 of the current KPO book year
- **THEN** the calendar SHALL NOT allow navigation to that date and the schema SHALL reject it with "Datum mora biti u godini knjige"

#### Scenario: Year-boundary error takes priority over future-date error

- **WHEN** the schema validates a date that is both after the book year end and in the future
- **THEN** the schema SHALL report "Datum mora biti u godini knjige" as the first error (not "Datum ne može biti u budućnosti")

#### Scenario: Impossible calendar date rejected

- **WHEN** the schema receives a string matching `YYYY-MM-DD` that does not correspond to a real calendar date (e.g., `2025-02-30`, `2025-13-01`)
- **THEN** the schema SHALL reject it with "Neispravan format datuma"

#### Scenario: Calendar opens at correct year for past-year book

- **WHEN** the user opens the entry form for a book whose year is earlier than the current year
- **THEN** the calendar SHALL open displaying a month within the book year (not the current month) and navigation SHALL be constrained to the book year's valid range

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

The system SHALL expose the active book's entries through selector and mutation modules scoped to the entry-management domain. Book-scoped consumers SHALL obtain the route id through `useBookId()`, read the active entries via a `useYDoc` selector, and add, update, or delete entries through entry mutations that write the active book's `entries` slice inside one `ydoc.transact(() => { ... })` block.

#### Scenario: Entry selector provides current entries for the active book

- **WHEN** the user adds, edits, or deletes an entry inside a book
- **THEN** consumers reading the active entries through the entry selector SHALL receive the updated entries array immediately and the change SHALL be persisted to the active book in the Yjs document

#### Scenario: Entry selector provides empty array for an empty book

- **WHEN** a freshly created book has `entries: []` and has just been opened
- **THEN** the entry selector SHALL provide an empty array

#### Scenario: Entries are isolated between books

- **WHEN** the user adds an entry in book `A`
- **THEN** opening book `B` SHALL NOT show that entry; book `B`'s entries remain unaffected

---

### Requirement: Entries persist across page reloads

The system SHALL store every book's entries as the `entries` field of that book inside the shared Yjs document's `books` map. On application load within a book-scoped route, the system SHALL restore the active book's entries from the document.

#### Scenario: Entries restored on reload within the same book

- **WHEN** the user has saved entries in a book and reloads the page at `/books/<id>`
- **THEN** the entries table SHALL display those entries

#### Scenario: No entries in a fresh book

- **WHEN** the user opens a book whose `entries` array is empty
- **THEN** the entries table SHALL show the empty-state message

---

### Requirement: Opis prometa field offers native autocomplete suggestions

The system SHALL offer autocomplete suggestions on the Opis prometa field of the entry form using the native HTML `<datalist>` API. The field SHALL remain an `<input>` associated with a `<datalist>` via the `list` attribute. The system SHALL NOT implement a custom dropdown, popover, or autocomplete component for this field.

Suggestion selection SHALL populate the Opis prometa field with the selected description and SHALL propagate that value to the form state so it is validated and saved like a typed value.

The existing form behavior, Zod validation, styling, and accessibility semantics of the field SHALL be preserved. The field SHALL keep its label, error display, and required-field validation unchanged.

#### Scenario: Description input is wired to a datalist

- **WHEN** the entry form is displayed
- **THEN** the Opis prometa input SHALL have a `list` attribute referencing a `<datalist>` element rendered in the document

#### Scenario: Selecting a suggestion populates the field

- **WHEN** the user selects one of the offered suggestions
- **THEN** the Opis prometa field SHALL contain the selected description and the form state SHALL hold that value

#### Scenario: Validation still applies to the field

- **WHEN** the user submits the entry form with an empty Opis prometa field
- **THEN** the form SHALL display "Polje je obavezno" next to the field and SHALL NOT save the entry

---

### Requirement: Suggestions are sourced from entries in every book

The system SHALL source Opis prometa suggestions from the descriptions of existing entries across **every book in the Yjs document**, not only the book currently being edited. Descriptions from the current year and from previous years SHALL both be eligible. The system SHALL NOT apply a year cutoff relative to the active book.

When no entries exist anywhere in the document, the system SHALL offer no suggestions.

#### Scenario: Suggestion from a previous year's book

- **WHEN** the user types in the Opis prometa field of a book for year `N`, and a matching description exists only on an entry in a book for year `N-1`
- **THEN** that description SHALL be offered as a suggestion

#### Scenario: Suggestion from the current book

- **WHEN** the user types in the Opis prometa field, and a matching description exists on another entry in the same book
- **THEN** that description SHALL be offered as a suggestion

#### Scenario: No entries anywhere

- **WHEN** the document contains no entries in any book and the user types in the Opis prometa field
- **THEN** no suggestions SHALL be offered

---

### Requirement: Suggestions appear only after at least one character is typed

The system SHALL offer no suggestions while the Opis prometa field is empty. Suggestions SHALL be offered only once the user has typed at least one character. The system SHALL achieve this by rendering no `<option>` elements when the field value is empty, so the browser has nothing to present.

#### Scenario: Empty field offers nothing

- **WHEN** the Opis prometa field is empty and focused
- **THEN** the associated `<datalist>` SHALL contain zero `<option>` elements

#### Scenario: One character triggers suggestions

- **WHEN** the user has typed at least one character into the Opis prometa field and matching prior descriptions exist
- **THEN** the associated `<datalist>` SHALL contain the matching descriptions as `<option>` elements

---

### Requirement: Suggestions are matched by case-insensitive substring

The system SHALL match the typed value against prior descriptions using a case-insensitive **substring** match. A description SHALL be offered if the typed value occurs anywhere within it, not only at its start.

The match SHALL NOT be narrower than the browser's own `<datalist>` filter, which re-filters the offered options by case-insensitive substring before presenting them. Diacritic folding is NOT performed: a typed value SHALL match only descriptions containing that exact sequence of characters, ignoring case.

#### Scenario: Match at the start of a description

- **WHEN** the user types `kons` and a prior description `Konsultacije` exists
- **THEN** `Konsultacije` SHALL be offered

#### Scenario: Match in the middle of a description

- **WHEN** the user types `kancel` and a prior description `Zakup kancelarije` exists
- **THEN** `Zakup kancelarije` SHALL be offered

#### Scenario: Case is ignored

- **WHEN** the user types `KONS` and a prior description `Konsultacije` exists
- **THEN** `Konsultacije` SHALL be offered

#### Scenario: No match offers nothing

- **WHEN** the user types a value that occurs in no prior description
- **THEN** no suggestions SHALL be offered

---

### Requirement: Suggestions are unique, ranked by frequency, and capped at five

The system SHALL offer at most **5** suggestions. Suggestions SHALL be unique: descriptions that differ only by surrounding whitespace or letter case SHALL be treated as one suggestion and SHALL occupy a single slot. The system SHALL present the most recently entered spelling of a deduplicated description as the offered value.

Suggestions SHALL be ranked by **frequency** — the number of entries across all books sharing that description — in descending order. Ties SHALL be broken by **recency**, the latest `datumPrometa` among the entries sharing that description, most recent first.

The 5-item cap SHALL be applied by the system after matching, not delegated to the browser, which imposes no limit of its own.

#### Scenario: At most five suggestions offered

- **WHEN** the typed value matches more than five distinct prior descriptions
- **THEN** exactly 5 suggestions SHALL be offered

#### Scenario: More frequent description ranks higher

- **WHEN** description `A` is used by 4 entries and description `B` by 1 entry, and both match the typed value
- **THEN** `A` SHALL be offered before `B`

#### Scenario: Recency breaks a frequency tie

- **WHEN** two matching descriptions are each used by the same number of entries, and one has a later `datumPrometa` than the other
- **THEN** the description with the later `datumPrometa` SHALL be offered first

#### Scenario: Case and whitespace variants are one suggestion

- **WHEN** entries contain `Konsultacije`, `konsultacije`, and `Konsultacije ` (trailing whitespace) and the typed value matches them
- **THEN** exactly one suggestion SHALL be offered for them, counted with a frequency of 3, presented as the most recently entered spelling

#### Scenario: Cap is applied to already-matched suggestions

- **WHEN** the system offers 5 suggestions for a typed value
- **THEN** every offered suggestion SHALL itself match the typed value, so that the browser's own filter removes none of them

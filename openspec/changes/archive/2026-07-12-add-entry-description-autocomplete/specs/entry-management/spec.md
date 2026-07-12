## ADDED Requirements

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

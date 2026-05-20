## ADDED Requirements

### Requirement: Book library warns when duplicate years exist

The system SHALL detect duplicate book years from the current books collection and render a persistent warning on the `/books` page whenever one or more years have more than one book.

#### Scenario: Warning is shown for a single duplicated year

- **WHEN** exactly two or more books share the same year (for example, 2026)
- **THEN** the `/books` page SHALL render a warning alert explaining that duplicate books were detected after sync
- **AND** the alert SHALL instruct the user to keep one book for that year and delete the others

#### Scenario: Warning is hidden when there are no duplicate years

- **WHEN** each existing book has a unique year
- **THEN** the `/books` page SHALL NOT render the duplicate-year warning alert

### Requirement: Duplicate warning lists all affected years

When duplicate years are present, the warning alert SHALL render a bullet list that includes every duplicated year and the number of books for that year.

#### Scenario: Multiple duplicated years are listed

- **WHEN** the books collection contains duplicates for multiple years (for example 2026 has 2 books and 2024 has 3 books)
- **THEN** the warning alert SHALL include bullet items for each duplicated year
- **AND** each item SHALL include both the year and duplicate count

#### Scenario: List updates after resolution

- **WHEN** the user deletes books so that one of the previously duplicated years becomes unique
- **THEN** that year SHALL be removed from the warning bullet list
- **AND** the warning SHALL disappear entirely when no duplicated years remain

### Requirement: Duplicated books are tagged in library rows

Each book row whose year is duplicated SHALL render a visible warning tag next to the year label, so users can identify conflicted records directly in the list.

#### Scenario: Every book in a duplicated year is tagged

- **WHEN** a year has multiple books
- **THEN** each row for that year SHALL display a duplicate warning tag next to the year

#### Scenario: Non-duplicated rows are not tagged

- **WHEN** a book year is unique in the current collection
- **THEN** that row SHALL NOT display the duplicate warning tag

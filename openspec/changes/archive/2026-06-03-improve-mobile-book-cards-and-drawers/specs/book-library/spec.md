## MODIFIED Requirements

### Requirement: Book library row displays total income for each book

Each book row in the library SHALL display the sum of all entry incomes for that book, formatted as currency, colored by `thresholdColor(income, ANNUAL_LIMIT)`. The income value SHALL be positioned with the row metadata in the card header. Each row SHALL also include a favorite toggle button (star icon) in the footer action area alongside the existing Open and Delete actions. Book library rows SHALL NOT display a visible entry-count label in the card itself; entry counts MAY remain visible in contextual confirmation copy such as delete warnings.

#### Scenario: Income displayed in each row

- **WHEN** the user navigates to `/books` and books exist
- **THEN** each book row SHALL display that book's total income

#### Scenario: Favorite toggle visible in each row

- **WHEN** the user navigates to `/books` and books exist
- **THEN** each book row SHALL display a star icon button that reflects the current `favorite` state
- **AND** pressing it SHALL toggle the book's `favorite` field

#### Scenario: Entry count hidden from library row card

- **WHEN** the user navigates to `/books` and a book row is rendered
- **THEN** the card SHALL NOT display a visible entry-count label such as `# unos` or `# unosa`
- **AND** the row SHALL still display the book year, total income, status tags, and actions

#### Scenario: Entry count remains in delete confirmation

- **WHEN** the user opens the delete confirmation for a book with entries
- **THEN** the confirmation copy SHALL include the book's entry count

## ADDED Requirements

### Requirement: Book library row displays total income for each book

Each book row in the library SHALL display the sum of all entry incomes for that book, formatted as currency, colored by `thresholdColor(income, ANNUAL_LIMIT)`. The income value SHALL be positioned between the existing book metadata and the action buttons.

#### Scenario: Income displayed in each row

- **WHEN** the user navigates to `/books` and books exist
- **THEN** each book row SHALL display that book's total income

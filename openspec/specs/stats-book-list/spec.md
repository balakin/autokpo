## ADDED Requirements

### Requirement: Book list row displays total income with threshold coloring

Each book row in the book library SHALL display the total income for that book's year formatted with `formatCurrency` from `src/formatters.ts`. The color of the value SHALL be determined by `thresholdColor(bookIncome, ANNUAL_LIMIT)`. No progress bar is shown; coloring alone signals the threshold state.

#### Scenario: Book income below 90% of annual limit

- **WHEN** a book's total income is below 5,400,000 RSD
- **THEN** the income value in that row SHALL be colored green/success

#### Scenario: Book income approaching annual limit

- **WHEN** a book's total income is between 5,400,000 and 6,000,000 RSD
- **THEN** the income value SHALL be colored yellow/warning

#### Scenario: Book income exceeds annual limit

- **WHEN** a book's total income exceeds 6,000,000 RSD
- **THEN** the income value SHALL be colored red/danger

#### Scenario: Book with no entries

- **WHEN** a book has no entries
- **THEN** the income value SHALL display as `formatCurrency(0)` in green/success color

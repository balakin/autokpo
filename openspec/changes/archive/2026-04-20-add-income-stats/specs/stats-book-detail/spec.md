## ADDED Requirements

### Requirement: Book detail entries tab shows income progress bar against annual limit

The "Unosi" (entries) tab in the working layout SHALL display a `BookIncomeProgress` component above the entries table. It SHALL show:

- Total income for the current book formatted with `formatCurrency` from `src/formatters.ts`
- A progress bar representing `bookIncome / ANNUAL_LIMIT`
- Color from `thresholdColor(bookIncome, ANNUAL_LIMIT)`
- A subtitle as a `<Trans>` containing `formatFullCurrency(ANNUAL_LIMIT)` and an `<a>` hyperlink to čl. 42 ZPDGa (linking to `https://mfin.gov.rs/sr/propisi-1/zakon-o-porezu-na-dohodak-gradjana-1`)

The progress bar SHALL be capped at 100% visually even if income exceeds the limit.

#### Scenario: Income below 90% of limit

- **WHEN** the book's total income is below 5,400,000 RSD
- **THEN** the progress bar SHALL be green/success

#### Scenario: Income approaching limit

- **WHEN** the book's total income is between 5,400,000 and 6,000,000 RSD
- **THEN** the progress bar SHALL be yellow/warning

#### Scenario: Income exceeds limit

- **WHEN** the book's total income exceeds 6,000,000 RSD
- **THEN** the progress bar SHALL be red/danger and visually full (100%)

#### Scenario: Progress bar updates as entries are added

- **WHEN** the user adds a new entry to the book
- **THEN** the progress bar SHALL update immediately to reflect the new total

## ADDED Requirements

### Requirement: Working layout entries tab shows income progress bar

The "Unosi" tab content SHALL include a `BookIncomeProgress` component above the entries table, showing total book income vs the `ANNUAL_LIMIT` (6,000,000 RSD) with threshold coloring. The component SHALL display the income as `formatCurrency`, a progress bar, and a subtitle with `formatFullCurrency(ANNUAL_LIMIT)` and a hyperlink to čl. 42 ZPDGa.

#### Scenario: Progress bar visible on entries tab

- **WHEN** the user opens a fully set-up book and the "Unosi" tab is active
- **THEN** an income progress bar SHALL be visible above the entries table

#### Scenario: Progress bar not shown on other tabs

- **WHEN** the "Profil" or "Potpis" tab is active
- **THEN** the income progress bar SHALL NOT be visible

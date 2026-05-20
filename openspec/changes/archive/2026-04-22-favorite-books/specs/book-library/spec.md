## MODIFIED Requirements

### Requirement: Book library row displays total income for each book

Each book row in the library SHALL display the sum of all entry incomes for that book, formatted as currency, colored by `thresholdColor(income, ANNUAL_LIMIT)`. The income value SHALL be positioned between the existing book metadata and the action buttons. Each row SHALL also include a favorite toggle button (star icon) in the footer action area alongside the existing Open and Delete actions.

#### Scenario: Income displayed in each row

- **WHEN** the user navigates to `/books` and books exist
- **THEN** each book row SHALL display that book's total income

#### Scenario: Favorite toggle visible in each row

- **WHEN** the user navigates to `/books` and books exist
- **THEN** each book row SHALL display a star icon button that reflects the current `favorite` state
- **AND** pressing it SHALL toggle the book's `favorite` field

## ADDED Requirements

### Requirement: Favorite books appear at the top of the library list

The book library list SHALL render all books with `favorite: true` first, then all non-favorite books. Within each group, books SHALL be sorted by year descending.

#### Scenario: Favorited books float to top

- **WHEN** the user navigates to `/books` and some books are favorited
- **THEN** all favorited books SHALL appear before all non-favorited books
- **AND** both groups SHALL be sorted by year descending

## MODIFIED Requirements

### Requirement: Library route is the application entry point

The system SHALL mount a browser router whose book library route is `/books` (not the root route). The root route (`/`) SHALL redirect to `/dashboard`. On first load with no saved state, the user SHALL land on the Dashboard. Unknown routes SHALL redirect to `/dashboard`.

#### Scenario: Root URL redirects to dashboard

- **WHEN** the user opens the application at the root URL `/`
- **THEN** the application SHALL redirect to `/dashboard` and render the Dashboard

#### Scenario: Unknown routes redirect to dashboard

- **WHEN** the user navigates to a URL that does not match `/dashboard`, `/books`, `/books/:bookId`, or `/settings`
- **THEN** the application SHALL redirect to `/dashboard`

#### Scenario: Book library renders at /books

- **WHEN** the user navigates to `/books`
- **THEN** the library SHALL be rendered inside the AppShell content area

### Requirement: Book library uses the app-wide page template

The `BookLibrary` page SHALL use the standard page layout: a full-width flex column with `gap-6` vertical spacing and `p-4 lg:p-6` padding. The page SHALL NOT render a visible heading row (icon + text). Instead, a visually-hidden `<h1 className="sr-only">Knjige</h1>` SHALL be placed at the top of the content area. The "Nova knjiga" action SHALL be rendered in the AppShell TopBar via `TopBarActionsSlot`.

#### Scenario: No visible page heading

- **WHEN** the user navigates to `/books`
- **THEN** the page SHALL NOT render a visible icon + "Knjige" heading row
- **AND** the page SHALL contain a visually-hidden `<h1 className="sr-only">Knjige</h1>`

#### Scenario: Layout is full-width

- **WHEN** the book library page is rendered
- **THEN** the content SHALL span the full available width of the AppShell content area without a max-width constraint

### Requirement: Year selector options span from KPO_FIRST_YEAR to current year

The year selector in the add-book modal SHALL offer years from `KPO_FIRST_YEAR` (2005, the year the Pravilnik came into force) up to the current year, ordered newest-first. Future years SHALL NOT appear in the list. The `KPO_FIRST_YEAR` constant SHALL be defined in `src/constants.ts`.

#### Scenario: Year selector options span from KPO_FIRST_YEAR to current year

- **WHEN** the add-book modal is open in the year 2026
- **THEN** the year selector SHALL offer years from 2026 down to 2005 (22 entries)
- **AND** future years (e.g. 2027) SHALL NOT appear

#### Scenario: Year selector works identically in earlier calendar years

- **WHEN** the add-book modal is open in the year 2010
- **THEN** the year selector SHALL offer years from 2010 down to 2005 (6 entries)

#### Scenario: Year already owned by another book is disabled in the list

- **WHEN** the add-book modal is open and a book already exists for year N
- **THEN** the option for year N SHALL be disabled and rendered with a "(zauzeto)" suffix

### Requirement: Year selector defaults to current year when available

The year selector SHALL default to the current year when it is not occupied by an existing book. When the current year is already occupied, the selector SHALL default to an empty selection (no value chosen).

#### Scenario: Current year is pre-selected when unoccupied

- **WHEN** the add-book modal opens and no book exists for the current year
- **THEN** the current year SHALL be pre-selected in the year selector

#### Scenario: No year is pre-selected when current year is occupied

- **WHEN** the add-book modal opens and a book already exists for the current year
- **THEN** no option SHALL be selected until the user picks one

#### Scenario: Submitting without selecting a year shows the required error

- **WHEN** the user presses submit without choosing a year (in the case where current year is occupied and no value was selected)
- **THEN** the year selector SHALL display the inline Serbian error "Polje je obavezno" and no book SHALL be created

#### Scenario: Submitting a valid year creates an empty book and navigates to it

- **WHEN** the user selects an available year and submits
- **THEN** a new book SHALL be persisted with a fresh `id`, the chosen `year`, `profile: null`, `signature: null`, and `entries: []`
- **AND** the application SHALL navigate to `/books/<id>`
- **AND** the modal SHALL close

## ADDED Requirements

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

### Requirement: Favorite books appear at the top of the library list

The book library list SHALL render all books with `favorite: true` first, then all non-favorite books. Within each group, books SHALL be sorted by year descending.

#### Scenario: Favorited books float to top

- **WHEN** the user navigates to `/books` and some books are favorited
- **THEN** all favorited books SHALL appear before all non-favorited books
- **AND** both groups SHALL be sorted by year descending

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

## REMOVED Requirements

### Requirement: Back-to-library action is available from both setup and working layouts

**Reason**: Navigation is now handled by AppShell breadcrumbs. Standalone back buttons are no longer needed.
**Migration**: Users navigate to the library via the "Knjige" sidebar item or breadcrumb links.

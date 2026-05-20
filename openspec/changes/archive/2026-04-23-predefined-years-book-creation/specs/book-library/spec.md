## MODIFIED Requirements

### Requirement: Year selector options span the current year and recent history

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

### Requirement: No default year is pre-selected

The year selector SHALL default to the current year when it is not occupied by an existing book. When the current year is already occupied, the selector SHALL default to an empty selection (no value chosen).

#### Scenario: Current year is pre-selected when unoccupied

- **WHEN** the add-book modal opens and no book exists for the current year
- **THEN** the current year SHALL be pre-selected in the year selector

#### Scenario: No year is pre-selected when current year is occupied

- **WHEN** the add-book modal opens and a book already exists for the current year
- **THEN** no option SHALL be selected until the user picks one

#### Scenario: submitting without selecting a year shows the required error

- **WHEN** the user presses submit without choosing a year (in the case where current year is occupied and no value was selected)
- **THEN** the year selector SHALL display the inline Serbian error "Polje je obavezno" and no book SHALL be created

#### Scenario: Submitting a valid year creates an empty book and navigates to it

- **WHEN** the user selects an available year and submits
- **THEN** a new book SHALL be persisted with a fresh `id`, the chosen `year`, `profile: null`, `signature: null`, and `entries: []`
- **AND** the application SHALL navigate to `/books/<id>`
- **AND** the modal SHALL close

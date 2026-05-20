## MODIFIED Requirements

### Requirement: Datum prometa field validates ISO date format

The system SHALL accept dates entered via a HeroUI DatePicker and validate that the stored value is a valid ISO date string in `YYYY-MM-DD` format that corresponds to a real calendar date. The allowed range is: on or after January 1 of the KPO book year, on or before December 31 of the KPO book year, and not after today in the Europe/Belgrade timezone. The Calendar SHALL enforce this range via `minValue` and `maxValue` props (not `isDateUnavailable`), so that navigation is constrained to the valid range and the calendar opens at the correct year when the book year differs from the current year. The Zod schema SHALL enforce the same range and SHALL additionally reject impossible calendar dates (e.g., February 30) that match the `YYYY-MM-DD` pattern but do not correspond to a real date. When multiple date constraints are violated, year-boundary errors SHALL be reported before the future-date error. Date boundary validation SHALL be implemented using `@internationalized/date` calendar comparisons and SHALL NOT depend on `date-fns`. The `today` value used for validation and calendar bounds SHALL be captured once when the form mounts and SHALL NOT change during the form session.

#### Scenario: Valid date accepted

- **WHEN** the user selects a date using the date picker that is within the book year and not after today
- **THEN** no validation error is shown for the Datum prometa field

#### Scenario: Empty date rejected

- **WHEN** the user submits the form without selecting a date
- **THEN** the form SHALL display "Polje je obavezno" next to the Datum prometa field

#### Scenario: Future date rejected

- **WHEN** the user selects a date after today (Europe/Belgrade timezone) that is still within the book year
- **THEN** the calendar SHALL NOT allow navigation to that date and the schema SHALL reject it with "Datum ne može biti u budućnosti"

#### Scenario: Date before book year rejected

- **WHEN** the user selects a date before January 1 of the current KPO book year
- **THEN** the calendar SHALL NOT allow navigation to that date and the schema SHALL reject it with "Datum mora biti u godini knjige"

#### Scenario: Date after book year rejected

- **WHEN** the user selects a date after December 31 of the current KPO book year
- **THEN** the calendar SHALL NOT allow navigation to that date and the schema SHALL reject it with "Datum mora biti u godini knjige"

#### Scenario: Year-boundary error takes priority over future-date error

- **WHEN** the schema validates a date that is both after the book year end and in the future
- **THEN** the schema SHALL report "Datum mora biti u godini knjige" as the first error (not "Datum ne može biti u budućnosti")

#### Scenario: Impossible calendar date rejected

- **WHEN** the schema receives a string matching `YYYY-MM-DD` that does not correspond to a real calendar date (e.g., `2025-02-30`, `2025-13-01`)
- **THEN** the schema SHALL reject it with "Neispravan format datuma"

#### Scenario: Calendar opens at correct year for past-year book

- **WHEN** the user opens the entry form for a book whose year is earlier than the current year
- **THEN** the calendar SHALL open displaying a month within the book year (not the current month) and navigation SHALL be constrained to the book year's valid range

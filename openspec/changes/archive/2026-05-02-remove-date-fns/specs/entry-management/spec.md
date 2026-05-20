## MODIFIED Requirements

### Requirement: Datum prometa field validates ISO date format

The system SHALL accept dates entered via a HeroUI DatePicker and validate that the stored value is a valid ISO date string. The calendar SHALL mark unavailable — and the Zod schema SHALL reject — any date that falls outside the allowed range. The allowed range is: on or after January 1 of the KPO book year, on or before December 31 of the KPO book year, and not after today in the Europe/Belgrade timezone. Date boundary validation SHALL be implemented using `@internationalized/date` calendar comparisons and SHALL NOT depend on `date-fns`.

#### Scenario: Valid date accepted

- **WHEN** the user selects a date using the date picker
- **THEN** no validation error is shown for the Datum prometa field

#### Scenario: Empty date rejected

- **WHEN** the user submits the form without selecting a date
- **THEN** the form SHALL display "Polje je obavezno" next to the Datum prometa field

#### Scenario: Future date rejected

- **WHEN** the user selects a date after today (Europe/Belgrade timezone)
- **THEN** the calendar SHALL render that date as unavailable and the schema SHALL reject it with a validation error

#### Scenario: Date before book year rejected

- **WHEN** the user selects a date before January 1 of the current KPO book year
- **THEN** the calendar SHALL render that date as unavailable and the schema SHALL reject it with a validation error

#### Scenario: Date after book year rejected

- **WHEN** the user selects a date after December 31 of the current KPO book year
- **THEN** the calendar SHALL render that date as unavailable and the schema SHALL reject it with a validation error

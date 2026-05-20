## MODIFIED Requirements

### Requirement: Last-12-months income uses a rolling day-precise window

The system SHALL compute `last12MonthsIncome` as the sum of all entry incomes across all books where `datumPrometa` is within the inclusive window from 12 calendar months before `today` through `today`. For stats calculations, `today` SHALL represent the current calendar date in the `Europe/Belgrade` timezone. The window `last12MonthsWindow` SHALL be `{ start: <today minus 12 calendar months>, end: today }`. This requirement SHALL be implemented without `date-fns` and SHALL preserve existing inclusive boundary behavior.

#### Scenario: Entries span multiple books

- **WHEN** entries from two different books both fall within the rolling 12-month window
- **THEN** `last12MonthsIncome` SHALL include entries from both books

#### Scenario: Entry exactly on window boundary

- **WHEN** an entry's `datumPrometa` equals the calculated window start exactly (same calendar day, 12 months prior)
- **THEN** that entry SHALL be included in `last12MonthsIncome`

### Requirement: Historical peak 12-month window uses a two-pointer sliding scan

The system SHALL compute `historicalPeak12M` as `{ income: number, window: { start: Date, end: Date } }` by scanning all entries across all books sorted by `datumPrometa` ascending, using a two-pointer approach where the left pointer excludes entries older than 12 calendar months before the right-pointer entry. The peak is the maximum running sum encountered. Window end = right-pointer entry's date; window start = right-pointer date minus 12 calendar months. If no entries exist, it SHALL be `null`. This calculation SHALL be implemented without `date-fns`, SHALL use `Europe/Belgrade` current-day semantics for the current-period window, and SHALL preserve current tie and boundary semantics.

#### Scenario: Peak window crosses two books

- **WHEN** the maximum 12-month sum spans entries from two different calendar-year books
- **THEN** `historicalPeak12M.income` SHALL include entries from both books

#### Scenario: Current period may be the peak

- **WHEN** the last 12 months from today produce the highest sum
- **THEN** `historicalPeak12M` SHALL reflect that window (same value as `last12MonthsIncome`)

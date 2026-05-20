## Purpose

Define deterministic income statistics computation, rolling windows, and threshold-related stat behavior across books.

## Requirements

### Requirement: Stats computation is pure and deterministic

The system SHALL expose a `computeStats(books: Book[], today: Date): Stats` pure function in `src/stats/compute.ts`. Given the same inputs it SHALL always return the same output. It SHALL have no side effects and no React dependencies.

#### Scenario: Returns all five stat fields

- **WHEN** `computeStats` is called with a non-empty books array and a fixed today date
- **THEN** the returned object SHALL contain: `currentYearIncome`, `last12MonthsIncome`, `last12MonthsWindow`, `historicalPeakYear`, `historicalPeak12M`, `allTimeTotal`

#### Scenario: No books

- **WHEN** `computeStats` is called with an empty books array
- **THEN** all income fields SHALL be `0` and peak fields SHALL be `null`

---

### Requirement: Current year income uses the book matching today's calendar year

The system SHALL compute `currentYearIncome` as the sum of all entry incomes in the book whose `year` equals `today.getFullYear()`. If no such book exists, `currentYearIncome` SHALL be `0`.

#### Scenario: Book exists for current year

- **WHEN** a book with `year === today.getFullYear()` exists and has entries
- **THEN** `currentYearIncome` SHALL equal the sum of `odProdajeProizvoda + odIzvrsenihUsluga` for all entries in that book

#### Scenario: No book for current year

- **WHEN** no book has `year === today.getFullYear()`
- **THEN** `currentYearIncome` SHALL be `0`

---

### Requirement: Last-12-months income uses a rolling day-precise window

The system SHALL compute `last12MonthsIncome` as the sum of all entry incomes across all books where `datumPrometa` is within the inclusive window from 12 calendar months before `today` through `today`. For stats calculations, `today` SHALL represent the current calendar date in the `Europe/Belgrade` timezone. The window `last12MonthsWindow` SHALL be `{ start: <today minus 12 calendar months>, end: today }`. This requirement SHALL be implemented without `date-fns` and SHALL preserve existing inclusive boundary behavior.

#### Scenario: Entries span multiple books

- **WHEN** entries from two different books both fall within the rolling 12-month window
- **THEN** `last12MonthsIncome` SHALL include entries from both books

#### Scenario: Entry exactly on window boundary

- **WHEN** an entry's `datumPrometa` equals the calculated window start exactly (same calendar day, 12 months prior)
- **THEN** that entry SHALL be included in `last12MonthsIncome`

### Requirement: Historical peak calendar year is the book with the highest total income

The system SHALL compute `historicalPeakYear` as `{ year: number, income: number }` for the book whose total entry income is highest across all books. If multiple books tie, the most recent year wins. If no books exist, it SHALL be `null`.

#### Scenario: Single book

- **WHEN** only one book exists
- **THEN** `historicalPeakYear` SHALL reflect that book's year and income

#### Scenario: Multiple books

- **WHEN** multiple books exist with different totals
- **THEN** `historicalPeakYear.year` SHALL be the year of the book with the highest total

---

### Requirement: Historical peak 12-month window uses a two-pointer sliding scan

The system SHALL compute `historicalPeak12M` as `{ income: number, window: { start: Date, end: Date } }` by scanning all entries across all books sorted by `datumPrometa` ascending, using a two-pointer approach where the left pointer excludes entries older than 12 calendar months before the right-pointer entry. The peak is the maximum running sum encountered. Window end = right-pointer entry's date; window start = right-pointer date minus 12 calendar months. If no entries exist, it SHALL be `null`. This calculation SHALL be implemented without `date-fns`, SHALL use `Europe/Belgrade` current-day semantics for the current-period window, and SHALL preserve current tie and boundary semantics.

#### Scenario: Peak window crosses two books

- **WHEN** the maximum 12-month sum spans entries from two different calendar-year books
- **THEN** `historicalPeak12M.income` SHALL include entries from both books

#### Scenario: Current period may be the peak

- **WHEN** the last 12 months from today produce the highest sum
- **THEN** `historicalPeak12M` SHALL reflect that window (same value as `last12MonthsIncome`)

### Requirement: All-time total is the sum of all entry income across all books

The system SHALL compute `allTimeTotal` as the sum of `odProdajeProizvoda + odIzvrsenihUsluga` for every entry in every book.

#### Scenario: Sum across multiple books

- **WHEN** multiple books exist
- **THEN** `allTimeTotal` SHALL be the grand total across all of them

---

### Requirement: Threshold coloring utility maps a value to a semantic color

The system SHALL expose a `thresholdColor(value: number, limit: number): 'success' | 'warning' | 'danger'` utility in `src/stats/threshold.ts`. Rules: `value / limit < 0.9` → `'success'`; `value / limit >= 0.9 && value <= limit` → `'warning'`; `value > limit` → `'danger'`.

#### Scenario: Value well below limit

- **WHEN** `value` is 50% of `limit`
- **THEN** `thresholdColor` SHALL return `'success'`

#### Scenario: Value approaching limit

- **WHEN** `value` is 92% of `limit`
- **THEN** `thresholdColor` SHALL return `'warning'`

#### Scenario: Value exceeds limit

- **WHEN** `value` is 110% of `limit`
- **THEN** `thresholdColor` SHALL return `'danger'`

---

### Requirement: Monetary display uses formatCurrency and formatFullCurrency from src/formatters.ts

The system SHALL provide two formatters in `src/formatters.ts` for RSD values:

- **`formatCurrency(value: number): string`** — compact format without currency symbol (e.g., `"4.200.000,00"`). Used for inline values in compact contexts: book-library income column, working-layout income value in the progress bar header.
- **`formatFullCurrency(value: number): string`** — full format with currency symbol (e.g., `"4.200.000,00 RSD"`). Used in stat-card main values, sidebar stats, dashboard card subtitles (limit amounts), income-chart tooltip, and working-layout limit label.

No component SHALL format RSD values independently — both formatters SHALL be used from `src/formatters.ts`.

#### Scenario: Income value rendered in a stat card

- **WHEN** a stat card displays an income value
- **THEN** the value SHALL be formatted using `formatFullCurrency`, producing dot-separated thousands, comma decimal, and "RSD" suffix (e.g., "4.200.000,00 RSD")

#### Scenario: Income value rendered in a compact list

- **WHEN** a book-library row or working-layout progress bar header displays an income value
- **THEN** the value SHALL be formatted using `formatCurrency`, producing dot-separated thousands and comma decimal without currency symbol (e.g., "4.200.000,00")

---

### Requirement: formatDateLong formats a Date with day, abbreviated month, and year

The system SHALL add `formatDateLong(date: Date): string` to `src/formatters.ts` using `Intl.DateTimeFormat('sr-Latn-RS', { day: 'numeric', month: 'short', year: 'numeric' })`. Example output: "12 apr 2023".

#### Scenario: Formats a known date

- **WHEN** `formatDateLong(new Date('2023-04-12'))` is called
- **THEN** the result SHALL contain "12", "apr" (or locale-equivalent abbreviation), and "2023"

---

### Requirement: Legal threshold constants in src/constants.ts

The system SHALL expose named constants for the two legal thresholds in `src/constants.ts`:

- `ANNUAL_LIMIT = 6_000_000` — calendar-year pausal tax threshold (čl. 42 ZPDGa)
- `ROLLING_LIMIT = 8_000_000` — rolling 12-month VAT threshold (čl. 33 ZPDV)

All components and computation code SHALL reference these constants instead of hardcoding the numeric values.

#### Scenario: Constants used in threshold computation

- **WHEN** `thresholdColor` or progress bars compare a value against a limit
- **THEN** the limit value SHALL come from `ANNUAL_LIMIT` or `ROLLING_LIMIT` constants

---

### Requirement: StatCard subtitle accepts ReactNode

The `StatCard` component's `subtitle` prop SHALL be typed as `ReactNode` (not `string`) to support rich content including `<Trans>` components with embedded `<a>` hyperlinks, formatted values, and plain strings.

#### Scenario: Subtitle with legal reference hyperlink

- **WHEN** a stat card displays a limit reference
- **THEN** the subtitle MAY contain an `<a>` tag linking to the relevant law article

## ADDED Requirements

### Requirement: Dashboard displays current-year and last-12M stat cards with progress bars

The dashboard SHALL render two primary stat cards using live data from `useStats()`:

1. **Current year card**: label "Ova godina", value formatted with `formatFullCurrency` from `src/formatters.ts`, progress bar showing `currentYearIncome / ANNUAL_LIMIT`, subtitle as a `<Trans>` containing `formatFullCurrency(ANNUAL_LIMIT)` and an `<a>` hyperlink to čl. 42 ZPDGa (linking to `https://mfin.gov.rs/sr/propisi-1/zakon-o-porezu-na-dohodak-gradjana-1`), color from `thresholdColor(currentYearIncome, ANNUAL_LIMIT)`.
2. **Last 12 months card**: label "Poslednjih 12 meseci", value formatted with `formatFullCurrency`, progress bar vs `ROLLING_LIMIT`, subtitle as a `<Trans>` containing `formatFullCurrency(ROLLING_LIMIT)` and an `<a>` hyperlink to čl. 33 ZPDV (linking to `https://purs.gov.rs/pravna-lica/pdv/zakon/202/zakon-o-porezu-na-dodatu-vrednost.html`), color from `thresholdColor(last12MonthsIncome, ROLLING_LIMIT)`.

#### Scenario: Values below 90% of limit

- **WHEN** both stats are below 90% of their respective limits
- **THEN** both cards SHALL render with green/success coloring

#### Scenario: Value between 90% and 100% of limit

- **WHEN** a stat is between 90% and 100% of its limit
- **THEN** that card SHALL render with yellow/warning coloring

#### Scenario: Value exceeds limit

- **WHEN** a stat exceeds its limit
- **THEN** that card SHALL render with red/danger coloring and the progress bar SHALL be capped at 100% visually

#### Scenario: Last 12M card shows legal limit reference

- **WHEN** the last-12M card is rendered
- **THEN** a subtitle SHALL display the legal limit reference with a hyperlink to čl. 33 ZPDV, formatted like "Limit: {formatFullCurrency(ROLLING_LIMIT)} (čl. 33 ZPDV)"

---

### Requirement: Dashboard displays historical peak cards

The dashboard SHALL render two secondary stat cards for historical peaks:

1. **Historical peak year card**: label "Rekordna godina", value = `formatFullCurrency(historicalPeakYear.income)`, subtitle = year number (e.g., "2023"), color from `thresholdColor(income, ANNUAL_LIMIT)`. If `null`, show `formatFullCurrency(0)` with no color.
2. **Historical peak 12M card**: label "Rekordnih 12 meseci", value = `formatFullCurrency(historicalPeak12M.income)`, subtitle = window date range formatted with `formatDateLong`, color from `thresholdColor(income, ROLLING_LIMIT)`. If `null`, show `formatFullCurrency(0)` with no color.

#### Scenario: Historical peak exceeded a limit

- **WHEN** the historical peak year income exceeded 6,000,000 RSD
- **THEN** the historical peak year card SHALL render with red/danger coloring

#### Scenario: No entries yet

- **WHEN** no entries exist across any book
- **THEN** historical peak cards SHALL show 0 RSD with neutral/no coloring

#### Scenario: Historical peak 12M shows date range

- **WHEN** `historicalPeak12M` is non-null
- **THEN** the card subtitle SHALL display the peak window formatted dates

---

### Requirement: Dashboard displays a per-year income bar chart

The dashboard SHALL render a bar chart (recharts `BarChart`) showing income per calendar year. The chart SHALL:

- Use data from all books sorted by year ascending
- Draw a horizontal reference line at `ANNUAL_LIMIT` (6,000,000 RSD) labeled "Paušalni limit"
- Use theme-aware colors via `readChartColors()` (reads CSS custom properties from `document.documentElement` per render)
- Be lazy-loaded with `React.lazy` to avoid blocking initial render

#### Scenario: Chart renders with multiple years

- **WHEN** multiple books exist
- **THEN** the chart SHALL display one bar per year

#### Scenario: Reference line is visible

- **WHEN** the chart is rendered
- **THEN** a horizontal dashed line at y=6,000,000 SHALL be visible with a label

#### Scenario: Dark mode colors applied

- **WHEN** the app is in dark mode
- **THEN** chart bars, axes, and grid lines SHALL use dark-mode-appropriate colors

---

### Requirement: Dashboard displays an all-time total card

The dashboard SHALL render a card labeled "Ukupno" showing `formatFullCurrency(allTimeTotal)` from `src/formatters.ts`. It SHALL have no progress bar and no limit context. It SHALL appear visually secondary to the current-state and historical-peak cards.

#### Scenario: All-time total shown

- **WHEN** the dashboard renders with books that have entries
- **THEN** the "Ukupno" card SHALL display the correct grand total

---

### Requirement: Income chart Y-axis tick formatting adapts to data scale

The income bar chart Y-axis SHALL use a scale-uniform tick formatter selected based on the maximum income value across all displayed bars. All ticks on the Y-axis SHALL use the same formatting tier.

- When the maximum bar value is less than 10,000 RSD, ticks SHALL display as raw integers (e.g., "5000", "10000")
- When the maximum bar value is between 10,000 and 999,999 RSD, ticks SHALL display with a "K" suffix and zero decimal places (e.g., "50K", "100K")
- When the maximum bar value is 1,000,000 RSD or greater, ticks SHALL display with an "M" suffix and one decimal place (e.g., "0.0M", "1.5M", "6.0M")
- The zero tick SHALL always display as "0" regardless of tier

#### Scenario: Small income data (under 10K)

- **WHEN** all bar values are below 10,000 RSD
- **THEN** Y-axis ticks SHALL show raw integer values (e.g., "0", "2500", "5000", "7500")

#### Scenario: Moderate income data (under 1M)

- **WHEN** the largest bar value is between 10,000 and 999,999 RSD
- **THEN** all Y-axis ticks SHALL use "K" suffix with zero decimals (e.g., "0", "200K", "400K", "600K")

#### Scenario: Large income data (1M or above)

- **WHEN** the largest bar value is 1,000,000 RSD or greater
- **THEN** all Y-axis ticks SHALL use "M" suffix with one decimal (e.g., "0.0M", "2.0M", "4.0M", "6.0M")

#### Scenario: Zero or empty data

- **WHEN** all bar values are zero or the books array is empty
- **THEN** Y-axis tick formatting SHALL still produce valid output (e.g., "0" for all tick values)

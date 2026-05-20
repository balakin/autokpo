## ADDED Requirements

### Requirement: Sidebar footer shows persistent current-year and last-12M indicators

The sidebar SHALL render a stats footer section below the navigation and above the version badge. It SHALL display two rows using live data from `useStats()`:

1. **Current year row**: label "Ova godina", value formatted with `formatFullCurrency` from `src/formatters.ts`, colored by `thresholdColor(currentYearIncome, ANNUAL_LIMIT)`
2. **Last 12M row**: label "12 meseci", value formatted with `formatFullCurrency`, colored by `thresholdColor(last12MonthsIncome, ROLLING_LIMIT)`

The footer SHALL be separated from the navigation by a visible border.

#### Scenario: Both values safe

- **WHEN** both stats are below 90% of their limits
- **THEN** both rows SHALL display in green/success color

#### Scenario: A value is approaching limit

- **WHEN** a stat is between 90% and 100% of its limit
- **THEN** that row SHALL display in yellow/warning color

#### Scenario: A value exceeds limit

- **WHEN** a stat exceeds its limit
- **THEN** that row SHALL display in red/danger color

#### Scenario: Sidebar stats visible on all pages

- **WHEN** the user navigates to any page (dashboard, books, settings, book detail)
- **THEN** the sidebar stats footer SHALL remain visible

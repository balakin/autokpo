## MODIFIED Requirements

### Requirement: Dashboard page displays statistics overview

The system SHALL render a Dashboard page at `/dashboard` with live income statistics cards, a per-year bar chart, and a latest book quick-access card. All statistics SHALL be computed from live localStorage data via `useStats()` and `useBooks()`.

#### Scenario: Dashboard renders with live stats

- **WHEN** the user navigates to `/dashboard`
- **THEN** the page SHALL display stat cards for current year income, last 12M income, historical peak year, historical peak 12M, and all-time total — all with live values

#### Scenario: Bar chart is visible

- **WHEN** the dashboard is rendered and at least one book exists
- **THEN** a bar chart showing income per year SHALL be visible (replacing the former chart placeholder)

#### Scenario: Latest book card with quick access

- **WHEN** the dashboard is rendered
- **THEN** a card representing the most recently used book SHALL be displayed with an "Otvori" link navigating to that book's route

#### Scenario: No visible page heading

- **WHEN** the dashboard is rendered
- **THEN** the page SHALL NOT display a visible icon + heading row at the top
- **AND** the page SHALL contain a visually-hidden `<h1 className="sr-only">Panel</h1>`

## REMOVED Requirements

### Requirement: Dashboard is markup only

**Reason**: Dashboard now consumes live data from `useBooks()` and `useStats()`. Hardcoded placeholders have been replaced with real computations.
**Migration**: The stats module (`src/stats/`) provides all data. No migration needed for users.

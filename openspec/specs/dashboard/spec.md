## MODIFIED Requirements

### Requirement: Dashboard page displays statistics overview

The system SHALL render a Dashboard page at `/dashboard` with live income statistics cards, a per-year bar chart, and a favorites section. All statistics SHALL be computed from the current Yjs-backed book state. The "latest book" quick-access card is replaced by the favorites section.

#### Scenario: Dashboard renders with live stats

- **WHEN** the user navigates to `/dashboard`
- **THEN** the page SHALL display stat cards for current year income, last 12M income, historical peak year, historical peak 12M, and all-time total — all with live values

#### Scenario: Bar chart is visible

- **WHEN** the dashboard is rendered and at least one book exists
- **THEN** a bar chart showing income per year SHALL be visible

#### Scenario: Favorites section shown with book links when favorites exist

- **WHEN** the dashboard is rendered and at least one book has `favorite: true`
- **THEN** a favorites section SHALL be displayed listing those books as links

#### Scenario: Favorites section shows empty state when no favorites exist

- **WHEN** the dashboard is rendered and no book has `favorite: true`
- **THEN** the favorites section SHALL still be rendered and SHALL display an empty-state prompt with a link to the book library

#### Scenario: No visible page heading

- **WHEN** the dashboard is rendered
- **THEN** the page SHALL NOT display a visible icon + heading row at the top
- **AND** the page SHALL contain a visually-hidden `<h1 className="sr-only">Panel</h1>`

#### Scenario: Favorites section and all-time total appear at the top

- **WHEN** the dashboard is rendered at any viewport width
- **THEN** the favorites section and the all-time total card SHALL appear in a 2-column grid above the primary stats grid and the bar chart
- **AND** the favorites section SHALL be the first cell in that grid (left on wide viewports, top on narrow ones)

## REMOVED Requirements

### Requirement: Latest book quick-access card

**Reason**: Replaced by the user-controlled favorites section. The auto-selected "latest by year" card provides no personalisation and is rendered redundant by the favorites feature.
**Migration**: Users can star the book they care about in the book library to restore equivalent quick access from the dashboard.

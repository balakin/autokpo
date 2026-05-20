## MODIFIED Requirements

### Requirement: Dashboard page displays statistics overview

The system SHALL render a Dashboard page at `/dashboard` with statistics cards, a chart placeholder, and a latest book quick-access card. All data on the dashboard SHALL be placeholder/fake values with no live logic.

#### Scenario: Dashboard renders with fake stats

- **WHEN** the user navigates to `/dashboard`
- **THEN** the page SHALL display statistics cards showing placeholder values for book count and entry count

#### Scenario: Chart placeholder is visible

- **WHEN** the dashboard is rendered
- **THEN** a chart placeholder area SHALL be visible indicating future functionality

#### Scenario: Latest book card with quick access

- **WHEN** the dashboard is rendered
- **THEN** a card representing the most recently used book SHALL be displayed with an "Otvori" link navigating to that book's route
- **AND** the card SHALL use fake/placeholder data

#### Scenario: No visible page heading

- **WHEN** the dashboard is rendered
- **THEN** the page SHALL NOT display a visible icon + heading row at the top
- **AND** the page SHALL contain a visually-hidden `<h1 className="sr-only">Panel</h1>`

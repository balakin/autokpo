## MODIFIED Requirements

### Requirement: Top bar provides breadcrumbs, context actions, and a profile button

The system SHALL render a top bar inside the content area containing breadcrumbs, context-specific action buttons, and a persistent profile avatar button. The breadcrumbs SHALL reflect the current route hierarchy. The profile avatar button SHALL always be the rightmost element and SHALL never be displaced by contextual page actions. All breadcrumb labels and aria-labels SHALL be translatable via Lingui macros.

#### Scenario: Breadcrumbs on dashboard

- **WHEN** the user is on the `/dashboard` route
- **THEN** the top bar SHALL display the translated equivalent of "Panel"

#### Scenario: Breadcrumbs on book library

- **WHEN** the user is on the `/books` route
- **THEN** the top bar SHALL display the translated equivalent of "Knjige"

#### Scenario: Breadcrumbs on a specific book

- **WHEN** the user is on the `/books/:bookId` route for a book with year 2024
- **THEN** the top bar SHALL display translated breadcrumbs "Knjige › 2024"

#### Scenario: Breadcrumbs on settings

- **WHEN** the user is on the `/settings` route
- **THEN** the top bar SHALL display the translated equivalent of "Podešavanja"

#### Scenario: Mobile hamburger button

- **WHEN** the viewport width is below the `lg` breakpoint
- **THEN** a hamburger menu button SHALL appear in the top bar
- **AND** pressing it SHALL open the sidebar drawer

#### Scenario: Profile button is rightmost in top bar

- **WHEN** the top bar is rendered with contextual page actions present
- **THEN** the profile avatar button SHALL appear to the right of those actions

#### Scenario: Profile button visible with no page actions

- **WHEN** the top bar is rendered on a page with no contextual actions
- **THEN** the profile avatar button SHALL still be visible at the right end of the top bar

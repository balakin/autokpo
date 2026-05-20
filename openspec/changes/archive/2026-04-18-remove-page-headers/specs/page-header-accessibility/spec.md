## ADDED Requirements

### Requirement: Pages with no visible heading MUST include a visually-hidden h1

Every page that removes its visible heading SHALL include an `<h1 className="sr-only">` element at the top of its content area. The text SHALL match the page's human-readable name. No icon SHALL be placed inside the sr-only heading.

#### Scenario: Screen reader announces page name on navigation

- **WHEN** a screen-reader user navigates to a page whose visual header has been removed
- **THEN** the document outline SHALL contain exactly one h1 with the page's name
- **AND** the h1 SHALL be announced by the screen reader when the user queries headings or the page landmark

#### Scenario: Heading is invisible to sighted users

- **WHEN** the page is rendered in a browser
- **THEN** the sr-only h1 SHALL NOT be visible — it SHALL have zero dimensions and be clipped via Tailwind's `sr-only` utility

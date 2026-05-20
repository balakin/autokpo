## MODIFIED Requirements

### Requirement: Library route is the application entry point

The system SHALL mount a browser router whose book library route is `/books` (not the root route). The root route (`/`) SHALL redirect to `/dashboard`. On first load with no saved state, the user SHALL land on the Dashboard. Unknown routes SHALL redirect to `/dashboard`.

#### Scenario: Root URL redirects to dashboard

- **WHEN** the user opens the application at the root URL `/`
- **THEN** the application SHALL redirect to `/dashboard` and render the Dashboard

#### Scenario: Unknown routes redirect to dashboard

- **WHEN** the user navigates to a URL that does not match `/dashboard`, `/books`, `/books/:bookId`, or `/settings`
- **THEN** the application SHALL redirect to `/dashboard`

#### Scenario: Book library renders at /books

- **WHEN** the user navigates to `/books`
- **THEN** the library SHALL be rendered inside the AppShell content area

## ADDED Requirements

### Requirement: Book library uses the app-wide page template

The `BookLibrary` page SHALL use the standard page layout: a full-width flex column with `gap-6` vertical spacing and `p-4 lg:p-6` padding. The page heading SHALL display a `LuBook` icon (`size-5 text-muted aria-hidden`) followed by the label "Knjige" in `text-xl font-semibold`. No centered max-width container SHALL be used. The "Nova knjiga" action SHALL be rendered in the AppShell TopBar via `TopBarActionsSlot`.

#### Scenario: Page heading shows icon and label

- **WHEN** the user navigates to `/books`
- **THEN** the page SHALL render a heading with a `LuBook` icon and the text "Knjige"

#### Scenario: Layout is full-width

- **WHEN** the book library page is rendered
- **THEN** the content SHALL span the full available width of the AppShell content area without a max-width constraint

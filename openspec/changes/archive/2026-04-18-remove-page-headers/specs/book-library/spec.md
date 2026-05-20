## MODIFIED Requirements

### Requirement: Book library uses the app-wide page template

The `BookLibrary` page SHALL use the standard page layout: a full-width flex column with `gap-6` vertical spacing and `p-4 lg:p-6` padding. The page SHALL NOT render a visible heading row (icon + text). Instead, a visually-hidden `<h1 className="sr-only">Knjige</h1>` SHALL be placed at the top of the content area. The "Nova knjiga" action SHALL be rendered in the AppShell TopBar via `TopBarActionsSlot`.

#### Scenario: No visible page heading

- **WHEN** the user navigates to `/books`
- **THEN** the page SHALL NOT render a visible icon + "Knjige" heading row
- **AND** the page SHALL contain a visually-hidden `<h1 className="sr-only">Knjige</h1>`

#### Scenario: Layout is full-width

- **WHEN** the book library page is rendered
- **THEN** the content SHALL span the full available width of the AppShell content area without a max-width constraint

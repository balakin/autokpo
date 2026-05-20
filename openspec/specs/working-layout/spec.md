## MODIFIED Requirements

### Requirement: App renders working layout when both profile and signature exist

The system SHALL render the working layout inside the book-scoped route (`/books/:bookId`) when the active book has both a saved profile and a saved signature. The working layout SHALL use HeroUI Tabs with three tabs: "Unosi" (entries table), "Profil" (entity profile preview), "Potpis" (signature preview). The DownloadPdfButton SHALL render as a full labeled button in the AppShell top bar. A draft-warning Alert SHALL render above the tabs, visible regardless of the active tab.

#### Scenario: Book fully set up

- **WHEN** the active book has both profile and signature saved
- **THEN** the book-scoped route SHALL render the working layout with tabs: Unosi, Profil, Potpis

#### Scenario: Unosi tab shows entries table

- **WHEN** the working layout is active and the "Unosi" tab is selected
- **THEN** the entries table SHALL be displayed with add/edit/delete actions

#### Scenario: Profil tab shows entity profile preview

- **WHEN** the working layout is active and the "Profil" tab is selected
- **THEN** the entity profile preview SHALL be displayed with an edit action that opens a modal

#### Scenario: Potpis tab shows signature preview

- **WHEN** the working layout is active and the "Potpis" tab is selected
- **THEN** the signature preview SHALL be displayed with an edit action that opens a modal

#### Scenario: Download PDF button always visible in top bar

- **WHEN** the user is on a book route with a fully set-up book
- **THEN** a full labeled "Preuzmi" button (LuDownload icon) SHALL appear in the AppShell top bar regardless of which tab is active

#### Scenario: Draft alert visible above all tabs

- **WHEN** the working layout is active
- **THEN** a warning alert about the PDF being a draft SHALL appear above the tab bar
- **AND** the alert SHALL remain visible when switching between tabs

## ADDED Requirements

### Requirement: Working layout entries tab shows income progress bar

The "Unosi" tab content SHALL include a `BookIncomeProgress` component above the entries table, showing total book income vs the `ANNUAL_LIMIT` (6,000,000 RSD) with threshold coloring. The component SHALL display the income as `formatCurrency`, a progress bar, and a subtitle with `formatFullCurrency(ANNUAL_LIMIT)` and a hyperlink to čl. 42 ZPDGa.

#### Scenario: Progress bar visible on entries tab

- **WHEN** the user opens a fully set-up book and the "Unosi" tab is active
- **THEN** an income progress bar SHALL be visible above the entries table

#### Scenario: Progress bar not shown on other tabs

- **WHEN** the "Profil" or "Potpis" tab is active
- **THEN** the income progress bar SHALL NOT be visible

## REMOVED Requirements

### Requirement: Working layout renders a two-column responsive layout

**Reason**: Replaced by tab-based navigation. Profile and signature are now on separate tabs instead of a right sidebar.
**Migration**: Users switch between Unosi/Profil/Potpis tabs instead of viewing sidebar alongside entries.

### Requirement: Working layout renders single-column on mobile

**Reason**: Replaced by tab-based navigation. Tabs work identically on mobile and desktop.
**Migration**: Mobile users switch tabs instead of seeing sidebar items stacked above the entries table.

### Requirement: Back-to-library action is available from both setup and working layouts

**Reason**: Navigation is now handled by AppShell breadcrumbs.
**Migration**: Users navigate to the library via the "Knjige" sidebar item or breadcrumb links.

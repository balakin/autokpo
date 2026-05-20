## MODIFIED Requirements

### Requirement: App renders setup layout when profile or signature is missing

The system SHALL render the setup wizard inside the book-scoped route (`/books/:bookId`) when the active book has either a missing profile or a missing signature. The root route (`/`) always renders the library regardless of profile/signature state, so this condition only applies once the user has opened a specific book.

#### Scenario: Newly created book with no profile or signature

- **WHEN** the user opens a freshly created book with both `profile` and `signature` null
- **THEN** the book-scoped route SHALL render the setup wizard

#### Scenario: Book has profile but signature is missing

- **WHEN** the active book has a saved profile but no signature
- **THEN** the book-scoped route SHALL render the setup wizard

#### Scenario: Book has signature but profile is missing

- **WHEN** the active book has a saved signature but no profile
- **THEN** the book-scoped route SHALL render the setup wizard

---

### Requirement: App renders working layout when both profile and signature exist

The system SHALL render the working layout inside the book-scoped route (`/books/:bookId`) when the active book has both a saved profile and a saved signature. The layout consumes the active book's data through the existing `EntityProfileContext`, `SignatureContext`, and `EntriesContext`, which are book-scoped at the provider layer.

#### Scenario: Book fully set up

- **WHEN** the active book has both profile and signature saved
- **THEN** the book-scoped route SHALL render the working layout with rows: download button, entity profile preview, entries table, signature preview

#### Scenario: Working layout renders a two-column responsive layout

- **WHEN** the working layout is active on a large screen
- **THEN** the entries table card SHALL appear in the primary (left) column and the sidebar (download PDF button, entity profile preview card, signature preview card) SHALL appear in the secondary (right) column

#### Scenario: Working layout renders single-column on mobile

- **WHEN** the working layout is active on a small screen
- **THEN** the sidebar items (download PDF button, entity profile preview card, signature preview card) SHALL appear first, followed by the entries table card

## ADDED Requirements

### Requirement: Book-scoped route resolves the active book or redirects

The system SHALL mount a `BookScope` component at `/books/:bookId` that reads `bookId` from the route params, resolves the book from `BooksContext`, and either (a) mounts the book-scoped profile/signature/entries providers and renders the appropriate child view or (b) redirects to `/` if the id is unknown.

#### Scenario: Unknown book id redirects to library

- **WHEN** the user navigates to `/books/does-not-exist`
- **THEN** the application SHALL redirect to `/` and render the library

#### Scenario: Known book id mounts book-scoped providers

- **WHEN** the user navigates to `/books/<id>` for a book that exists
- **THEN** `EntityProfileProvider`, `SignatureProvider`, and `EntriesProvider` SHALL be mounted scoped to `<id>` and the appropriate child view (wizard or working layout) SHALL render

---

### Requirement: Back-to-library action is available from both setup and working layouts

The system SHALL expose a visible "Back to library" action in both the setup wizard and the working layout. Activating it SHALL navigate to `/` without modifying the active book.

#### Scenario: Back from working layout

- **WHEN** the user is in the working layout of a book and activates the back-to-library action
- **THEN** the browser URL SHALL change to `/` and the library SHALL render

#### Scenario: Back from setup wizard

- **WHEN** the user is in the setup wizard of a book and activates the back-to-library action
- **THEN** the browser URL SHALL change to `/` and the library SHALL render; the partially-set-up book SHALL remain in the library

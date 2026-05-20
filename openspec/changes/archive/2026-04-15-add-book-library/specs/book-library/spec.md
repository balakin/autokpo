## ADDED Requirements

### Requirement: Library route is the application entry point

The system SHALL mount a browser router whose root route (`/`) renders the book library. On first load, unknown routes, and after the user exits any book, the user SHALL land on the library.

#### Scenario: App loads on the library route

- **WHEN** the user opens the application at the root URL
- **THEN** the library SHALL be rendered and no book-scoped view (setup wizard or working layout) SHALL be rendered

#### Scenario: Unknown routes redirect to the library

- **WHEN** the user navigates to a URL that does not match `/` or `/books/:bookId`
- **THEN** the application SHALL redirect to `/` and render the library

---

### Requirement: Library displays every saved book grouped by year

The system SHALL list every book persisted in `localStorage` under `kpo:books`, sorted by year descending (newest first). Each entry SHALL show the year and a visual indicator of completion state.

#### Scenario: Books are listed newest first

- **WHEN** the library is rendered with books for 2024, 2026, and 2025
- **THEN** the list SHALL display the books in the order 2026, 2025, 2024

#### Scenario: Empty state when no books exist

- **WHEN** the library is rendered and `kpo:books` is empty or missing
- **THEN** the library SHALL show an empty-state message in Serbian inviting the user to create the first book

#### Scenario: Incomplete books show a "Nezavršeno" badge

- **WHEN** a book has a missing profile or signature
- **THEN** its library entry SHALL display a "Nezavršeno" badge

#### Scenario: Completed books show no incomplete badge

- **WHEN** a book has both profile and signature saved
- **THEN** its library entry SHALL NOT display the "Nezavršeno" badge

---

### Requirement: User can add a new book via a modal with a year selector

The system SHALL render an "Add book" action in the library that opens a modal containing a year selector. Submitting the modal with a valid year SHALL create a new empty book and navigate to it; cancelling SHALL close the modal without creating a book.

#### Scenario: Add book modal opens

- **WHEN** the user presses the Add book action in the library
- **THEN** a modal dialog SHALL open containing a HeroUI `Select` for the year, a cancel button, and a submit button

#### Scenario: Year selector options span the current year and recent history

- **WHEN** the add-book modal is open
- **THEN** the year selector SHALL offer years from (current year + 1) down to (current year − 10), newest first

#### Scenario: Year already owned by another book is disabled in the list

- **WHEN** the add-book modal is open and a book already exists for year N
- **THEN** the option for year N SHALL be disabled and rendered with a "(zauzeto)" suffix

#### Scenario: No default year is pre-selected

- **WHEN** the add-book modal opens
- **THEN** no option SHALL be selected until the user picks one

#### Scenario: Submitting without selecting a year shows the required error

- **WHEN** the user presses submit without choosing a year
- **THEN** the year selector SHALL display the inline Serbian error "Polje je obavezno" and no book SHALL be created

#### Scenario: Submitting a valid year creates an empty book and navigates to it

- **WHEN** the user selects an available year and submits
- **THEN** a new book SHALL be persisted with a fresh `id`, the chosen `year`, `profile: null`, `signature: null`, and `entries: []`
- **AND** the application SHALL navigate to `/books/<id>`
- **AND** the modal SHALL close

---

### Requirement: User can open an existing book from the library

The system SHALL render an "Open book" action on every library entry. Activating it SHALL navigate the browser to the book's URL.

#### Scenario: Open book navigates to the book route

- **WHEN** the user activates the Open action on a book with id `X`
- **THEN** the browser URL SHALL change to `/books/X` and the book-scoped view SHALL render

---

### Requirement: User can remove a book with explicit confirmation

The system SHALL expose a "Remove book" action on every library entry. Activating it SHALL open a confirmation dialog; confirming SHALL permanently delete the book and its data; cancelling SHALL dismiss the dialog with no effect.

#### Scenario: Remove action opens confirmation dialog

- **WHEN** the user activates the Remove action on a book
- **THEN** a confirmation dialog SHALL open showing the book's year and its entry count

#### Scenario: Confirming deletion removes the book

- **WHEN** the user confirms deletion
- **THEN** the book SHALL be removed from `kpo:books` and the library list SHALL no longer contain it

#### Scenario: Cancelling deletion leaves the book intact

- **WHEN** the user cancels the confirmation dialog
- **THEN** the dialog SHALL close and the book SHALL remain in the library

---

### Requirement: Exactly one book per calendar year

The system SHALL NOT allow two books to coexist with the same `year`. Year uniqueness SHALL be enforced by the year selector (occupied years disabled) and by the book-create code path (refusing to persist a duplicate year and surfacing an error in the modal).

#### Scenario: Year uniqueness prevents creation via UI

- **WHEN** the user attempts to submit the add-book modal with a year that matches an existing book
- **THEN** the book SHALL NOT be created and the user SHALL remain on the modal

---

### Requirement: Books are persisted as an array under `kpo:books`

The system SHALL store every book as an element of a JSON array at `localStorage["kpo:books"]`. Each book SHALL include `id` (uuid v4), `year` (integer), `profile` (object or null), `signature` (object or null), `entries` (array), and `createdAt` (ISO string). On boot, the system SHALL parse the array with Zod and fall back to an empty list on parse failure.

#### Scenario: Books survive a page reload

- **WHEN** the user creates a book, reloads the page, and navigates to the library
- **THEN** the created book SHALL be present in the library list

#### Scenario: Corrupt storage is tolerated

- **WHEN** `kpo:books` contains invalid JSON or fails Zod validation
- **THEN** the library SHALL render as if no books exist and no runtime error SHALL surface to the user

---

### Requirement: `BooksProvider` exposes the books list and CRUD operations

The system SHALL expose a React context `BooksContext` providing the full `books` array and three operations: `createBook(year)`, `removeBook(bookId)`, and `getBookById(bookId)`. Consumers (library, `BookScope`, downstream providers) SHALL read and mutate books exclusively through this context.

#### Scenario: Context provides the current books array

- **WHEN** any descendant component reads `BooksContext`
- **THEN** the returned `books` SHALL match the current `kpo:books` contents

#### Scenario: `createBook` enforces year uniqueness

- **WHEN** `createBook(year)` is called with a year already present in `books`
- **THEN** the call SHALL throw or return an error result and SHALL NOT modify storage

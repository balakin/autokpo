## MODIFIED Requirements

### Requirement: Entries are accessible to the rest of the application

The system SHALL expose the active book's entries via `EntriesContext`. The provider SHALL be mounted only inside `BookScope` and SHALL read/write the `entries` slice of the active book through `BooksContext`. Consumers (entries table, entry modal, PDF export) SHALL continue to read `entries` as they do today (no API change).

#### Scenario: EntriesContext provides current entries for the active book

- **WHEN** the user adds, edits, or deletes an entry inside a book
- **THEN** consumers of `EntriesContext` SHALL receive the updated entries array immediately and the change SHALL be persisted to the active book in `kpo:books`

#### Scenario: EntriesContext provides empty array for an empty book

- **WHEN** a freshly created book has `entries: []` and has just been opened
- **THEN** `EntriesContext` SHALL provide an empty array

#### Scenario: Entries are isolated between books

- **WHEN** the user adds an entry in book `A`
- **THEN** opening book `B` SHALL NOT show that entry; book `B`'s entries remain unaffected

---

### Requirement: Entries persist across page reloads

The system SHALL store every book's entries as the `entries` field of that book inside the `kpo:books` array in `localStorage`. On application load within a book-scoped route, the system SHALL restore the active book's entries from storage.

#### Scenario: Entries restored on reload within the same book

- **WHEN** the user has saved entries in a book and reloads the page at `/books/<id>`
- **THEN** the entries table SHALL display those entries

#### Scenario: No entries in a fresh book

- **WHEN** the user opens a book whose `entries` array is empty
- **THEN** the entries table SHALL show the empty-state message

## REMOVED Requirements

### Requirement: Entries persist across page reloads (legacy key)

**Reason**: The legacy top-level storage key `kpo:entries` is superseded by book-scoped persistence inside `kpo:books`. Entries are no longer a global singleton array; each book owns its own entries.

**Migration**: None. The application is unreleased, so no user data exists under the legacy key. Implementations SHALL delete any read/write paths that reference `kpo:entries`.

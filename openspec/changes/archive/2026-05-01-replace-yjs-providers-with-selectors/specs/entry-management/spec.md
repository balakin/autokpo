## MODIFIED Requirements

### Requirement: Entries are accessible to the rest of the application

The system SHALL expose the active book's entries through selector and mutation modules scoped to the entry-management domain. Book-scoped consumers SHALL obtain the route id through `useBookId()`, read the active entries via a `useYDoc` selector, and add, update, or delete entries through entry mutations that write the active book's `entries` slice inside one `ydoc.transact(() => { ... })` block.

#### Scenario: Entry selector provides current entries for the active book

- **WHEN** the user adds, edits, or deletes an entry inside a book
- **THEN** consumers reading the active entries through the entry selector SHALL receive the updated entries array immediately and the change SHALL be persisted to the active book in the Yjs document

#### Scenario: Entry selector provides empty array for an empty book

- **WHEN** a freshly created book has `entries: []` and has just been opened
- **THEN** the entry selector SHALL provide an empty array

#### Scenario: Entries are isolated between books

- **WHEN** the user adds an entry in book `A`
- **THEN** opening book `B` SHALL NOT show that entry; book `B`'s entries remain unaffected

### Requirement: Entries persist across page reloads

The system SHALL store every book's entries as the `entries` field of that book inside the shared Yjs document's `books` map. On application load within a book-scoped route, the system SHALL restore the active book's entries from the document.

#### Scenario: Entries restored on reload within the same book

- **WHEN** the user has saved entries in a book and reloads the page at `/books/<id>`
- **THEN** the entries table SHALL display those entries

#### Scenario: No entries in a fresh book

- **WHEN** the user opens a book whose `entries` array is empty
- **THEN** the entries table SHALL show the empty-state message

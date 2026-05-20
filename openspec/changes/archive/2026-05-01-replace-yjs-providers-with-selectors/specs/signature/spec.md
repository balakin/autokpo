## MODIFIED Requirements

### Requirement: Signature persists across page reloads

The system SHALL store the signature as the `signature` field of the active book inside the shared Yjs document's `books` map. Each book owns its own signature; there is no shared global signature. On application load within a book-scoped route, the system SHALL restore both signature field values from the active book's signature if present.

#### Scenario: Signature restored on reload within the same book

- **WHEN** the user has saved a valid signature on a book and reloads the page at `/books/<id>`
- **THEN** both signature fields SHALL be pre-populated with the saved values for that book

#### Scenario: No signature in the active book

- **WHEN** the user opens a book whose `signature` is `null`
- **THEN** both signature fields SHALL be empty

#### Scenario: Signature is isolated between books

- **WHEN** the user has distinct signatures saved in books `A` and `B`
- **THEN** the working layout for `A` SHALL display `A`'s signature and the working layout for `B` SHALL display `B`'s signature

### Requirement: Signature is accessible to the rest of the application

The system SHALL expose the active book's signature through selector and mutation modules scoped to the signature domain. Book-scoped consumers SHALL obtain the route id through `useBookId()`, read the active signature via a `useYDoc` selector, and save changes through a signature mutation that writes the active book's `signature` slice inside one `ydoc.transact(() => { ... })` block.

#### Scenario: Signature available after save

- **WHEN** the user saves a valid signature inside a book
- **THEN** consumers reading the active signature through the signature selector SHALL receive the updated signature object immediately and the change SHALL be persisted to the active book in the Yjs document

#### Scenario: Signature null before first save in a new book

- **WHEN** a freshly created book has `signature: null` and has just been opened
- **THEN** the signature selector SHALL return `null` as the signature value

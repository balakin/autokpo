## MODIFIED Requirements

### Requirement: Profile persists across page reloads

The system SHALL store the entity profile as the `profile` field of the active book inside the shared Yjs document's `books` map. Each book owns its own profile; there is no shared global profile. On application load within a book-scoped route, the system SHALL restore all field values from the active book's profile if present.

#### Scenario: Profile restored on reload within the same book

- **WHEN** the user has saved a valid profile on a book and reloads the page at `/books/<id>`
- **THEN** all six form fields SHALL be pre-populated with the saved values for that book

#### Scenario: No profile in the active book

- **WHEN** the user opens a book whose `profile` is `null`
- **THEN** all form fields SHALL be empty

#### Scenario: Profile is isolated between books

- **WHEN** the user has distinct profiles saved in books `A` and `B`
- **THEN** the working layout for `A` SHALL display `A`'s profile and the working layout for `B` SHALL display `B`'s profile

### Requirement: Profile is accessible to the rest of the application

The system SHALL expose the active book's entity profile through selector and mutation modules scoped to the entity-profile domain. Book-scoped consumers SHALL obtain the route id through `useBookId()`, read the active profile via a `useYDoc` selector, and save changes through a profile mutation that writes the active book's `profile` slice inside one `ydoc.transact(() => { ... })` block.

#### Scenario: Profile available after save

- **WHEN** the user saves a valid profile inside a book
- **THEN** consumers reading the active profile through the entity-profile selector SHALL receive the updated profile object immediately and the change SHALL be persisted to the active book in the Yjs document

#### Scenario: Profile null before first save in a new book

- **WHEN** a freshly created book has `profile: null` and has just been opened
- **THEN** the entity-profile selector SHALL return `null` as the profile value

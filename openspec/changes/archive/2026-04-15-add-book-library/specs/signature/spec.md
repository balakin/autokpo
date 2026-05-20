## MODIFIED Requirements

### Requirement: Signature persists across page reloads

The system SHALL store the signature as the `signature` field of the active book inside the `kpo:books` array in `localStorage`. Each book owns its own signature; there is no shared global signature. On application load within a book-scoped route, the system SHALL restore both signature field values from the active book's signature if present.

#### Scenario: Signature restored on reload within the same book

- **WHEN** the user has saved a valid signature on a book and reloads the page at `/books/<id>`
- **THEN** both signature fields SHALL be pre-populated with the saved values for that book

#### Scenario: No signature in the active book

- **WHEN** the user opens a book whose `signature` is `null`
- **THEN** both signature fields SHALL be empty

#### Scenario: Signature is isolated between books

- **WHEN** the user has distinct signatures saved in books `A` and `B`
- **THEN** the working layout for `A` SHALL display `A`'s signature and the working layout for `B` SHALL display `B`'s signature

---

### Requirement: Signature is accessible to the rest of the application

The system SHALL expose the active book's signature via `SignatureContext`. The provider SHALL be mounted only inside `BookScope` and SHALL read/write the signature slice of the active book through `BooksContext`. Consumers SHALL continue to read `signature` as they do today (no API change).

#### Scenario: SignatureContext provides signature after save

- **WHEN** the user saves a valid signature inside a book
- **THEN** consumers of `SignatureContext` SHALL receive the updated signature object immediately and the change SHALL be persisted to the active book in `kpo:books`

#### Scenario: SignatureContext provides null before first save in a new book

- **WHEN** a freshly created book has `signature: null` and has just been opened
- **THEN** `SignatureContext` SHALL provide `null` as the signature value

## REMOVED Requirements

### Requirement: Signature persists across page reloads (legacy key)

**Reason**: The legacy top-level storage key `kpo:signature` is superseded by book-scoped persistence inside `kpo:books`. Signature is no longer a global singleton; each book owns its own signature.

**Migration**: None. The application is unreleased, so no user data exists under the legacy key. Implementations SHALL delete any read/write paths that reference `kpo:signature`.

## MODIFIED Requirements

### Requirement: Profile persists across page reloads

The system SHALL store the entity profile as the `profile` field of the active book inside the `kpo:books` array in `localStorage`. Each book owns its own profile; there is no shared global profile. On application load within a book-scoped route, the system SHALL restore all field values from the active book's profile if present.

#### Scenario: Profile restored on reload within the same book

- **WHEN** the user has saved a valid profile on a book and reloads the page at `/books/<id>`
- **THEN** all six form fields SHALL be pre-populated with the saved values for that book

#### Scenario: No profile in the active book

- **WHEN** the user opens a book whose `profile` is `null`
- **THEN** all form fields SHALL be empty

#### Scenario: Profile is isolated between books

- **WHEN** the user has distinct profiles saved in books `A` and `B`
- **THEN** the working layout for `A` SHALL display `A`'s profile and the working layout for `B` SHALL display `B`'s profile

---

### Requirement: Profile is accessible to the rest of the application

The system SHALL expose the active book's entity profile via `EntityProfileContext`. The provider SHALL be mounted only inside `BookScope` and SHALL read/write the profile slice of the active book through `BooksContext`. Consumers SHALL continue to read `profile` as they do today (no API change).

#### Scenario: Profile available after save

- **WHEN** the user saves a valid profile inside a book
- **THEN** consumers of `EntityProfileContext` SHALL receive the updated profile object immediately and the change SHALL be persisted to the active book in `kpo:books`

#### Scenario: Profile null before first save in a new book

- **WHEN** a freshly created book has `profile: null` and has just been opened
- **THEN** `EntityProfileContext` SHALL provide `null` as the profile value

## REMOVED Requirements

### Requirement: Profile persists across page reloads (legacy key)

**Reason**: The legacy top-level storage key `kpo:entity-profile` is superseded by book-scoped persistence inside `kpo:books`. Entity profile is no longer a global singleton; each book owns its own profile.

**Migration**: None. The application is unreleased, so no user data exists under the legacy key. Implementations SHALL delete any read/write paths that reference `kpo:entity-profile`.

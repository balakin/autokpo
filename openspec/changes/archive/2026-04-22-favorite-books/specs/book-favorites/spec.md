## ADDED Requirements

### Requirement: Book has a favorite flag

The `Book` model SHALL include a `favorite: boolean` field that defaults to `false`. Existing stored books that lack this field SHALL parse successfully and be treated as `favorite: false`.

#### Scenario: New book is not favorited by default

- **WHEN** a new book is created
- **THEN** its `favorite` field SHALL be `false`

#### Scenario: Existing stored books without favorite field parse correctly

- **WHEN** `getBooks()` reads a stored book that has no `favorite` key
- **THEN** the book SHALL parse successfully with `favorite` defaulting to `false`

### Requirement: User can toggle a book's favorite status

The system SHALL allow the user to mark or unmark any book as a favorite. The toggle SHALL be available in the book library row. The action SHALL persist immediately to localStorage via `updateBook`.

#### Scenario: Marking a book as favorite

- **WHEN** the user activates the favorite toggle on a book that is not favorited
- **THEN** the book's `favorite` field SHALL become `true`
- **AND** the change SHALL be persisted to localStorage

#### Scenario: Unmarking a book as favorite

- **WHEN** the user activates the favorite toggle on a book that is already favorited
- **THEN** the book's `favorite` field SHALL become `false`
- **AND** the change SHALL be persisted to localStorage

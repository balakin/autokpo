## ADDED Requirements

### Requirement: Book-backed Yjs state is accessed without provider wrappers

The system SHALL read book-backed application state directly from the shared Yjs document through selector-based subscriptions and SHALL mutate that state through domain commands that accept the doc instance. The system SHALL NOT require a React provider or context wrapper dedicated to the books domain.

#### Scenario: Book library reads from selector-based subscriptions

- **WHEN** the book library, dashboard, setup flow, or breadcrumb UI needs book-backed state
- **THEN** each consumer SHALL derive only the slice it needs from the shared Yjs document
- **AND** no dedicated books provider SHALL be required in the runtime tree

#### Scenario: Book mutations run as domain commands

- **WHEN** the user creates, removes, or updates a book-backed field such as `favorite`
- **THEN** the write SHALL be performed through a books-domain command that receives the Yjs document
- **AND** the command SHALL apply its related Yjs writes within a transaction

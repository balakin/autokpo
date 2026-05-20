## MODIFIED Requirements

### Requirement: Export button is available in the main application view

The system SHALL render a "Preuzmi PDF" button in the working layout of the active book. The button SHALL consume the active book's profile, signature, and entries via their existing contexts (`EntityProfileContext`, `SignatureContext`, `EntriesContext`), which are now book-scoped.

#### Scenario: Button is visible in the active book's working layout

- **WHEN** the user opens a fully set-up book at `/books/<id>`
- **THEN** the "Preuzmi PDF" button SHALL be visible in the working layout

#### Scenario: Button is not rendered outside the working layout

- **WHEN** the user is on the library route (`/`) or on the setup wizard of a book
- **THEN** the "Preuzmi PDF" button SHALL NOT be rendered

#### Scenario: Generated PDF reflects the active book only

- **WHEN** the user generates a PDF while viewing book `X`
- **THEN** the PDF SHALL include `X`'s profile, signature, and entries and SHALL NOT include data from any other book

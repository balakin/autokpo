## MODIFIED Requirements

### Requirement: Wizard starts at welcome step on first visit

The system SHALL render the welcome step when the active book has neither entity profile nor signature saved (both context values are `null`). The wizard is scoped to the book identified by the current `/books/:bookId` route; it is not a global onboarding flow.

#### Scenario: Fresh book with no data

- **WHEN** the user opens a freshly created book at `/books/<id>` (both profile and signature are null)
- **THEN** the setup wizard SHALL display the welcome step with a "Počnite" button

---

### Requirement: Wizard resumes at signature step when profile exists but signature does not

The system SHALL skip the welcome step and render the signature step directly when the active book has a saved profile but no signature.

#### Scenario: Reload mid-wizard after profile saved in a book

- **WHEN** the user has a saved profile in a book but no signature and reloads the page at `/books/<id>`
- **THEN** the setup wizard SHALL display the signature step, not the welcome step

---

### Requirement: Signature step completes setup on successful form submission

The system SHALL complete setup when the signature form is submitted successfully on the signature step. Completing setup causes the book-scoped route to re-render into `WorkingLayout` (since both profile and signature are now non-null in their contexts for the active book).

#### Scenario: Valid signature submitted

- **WHEN** the wizard is on the signature step inside a book and the user submits a valid signature form
- **THEN** both entity profile and signature SHALL be saved in that book
- **AND** the book-scoped route SHALL render the working layout

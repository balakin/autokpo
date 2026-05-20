### Requirement: Signature form renders Sastavio and Odgovorno lice fields

The system SHALL render a form with two fields matching the official KPO signature block: "Sastavio" (compiled by) and "Odgovorno lice" (responsible person). All labels SHALL be in Serbian.

#### Scenario: Form displays both fields

- **WHEN** the user opens the application
- **THEN** a signature form SHALL be visible with labelled inputs for "Sastavio" and "Odgovorno lice"

---

### Requirement: Both signature fields are required

The system SHALL reject saving the signature if either field is empty, displaying "Polje je obavezno" next to each empty field.

#### Scenario: Save with empty field

- **WHEN** the user attempts to save the signature with one or both fields empty
- **THEN** the system SHALL display "Polje je obavezno" next to each empty field and SHALL NOT persist the signature

#### Scenario: Save with both fields filled

- **WHEN** the user fills both fields with non-empty values and submits
- **THEN** the system SHALL persist the signature and dismiss any validation errors

---

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

---

### Requirement: Signature is accessible to the rest of the application

The system SHALL expose the active book's signature through selector and mutation modules scoped to the signature domain. Book-scoped consumers SHALL obtain the route id through `useBookId()`, read the active signature via a `useYDoc` selector, and save changes through a signature mutation that writes the active book's `signature` slice inside one `ydoc.transact(() => { ... })` block.

#### Scenario: Signature available after save

- **WHEN** the user saves a valid signature inside a book
- **THEN** consumers reading the active signature through the signature selector SHALL receive the updated signature object immediately and the change SHALL be persisted to the active book in the Yjs document

#### Scenario: Signature null before first save in a new book

- **WHEN** a freshly created book has `signature: null` and has just been opened
- **THEN** the signature selector SHALL return `null` as the signature value

---

### Requirement: Signature form accepts formId and onSuccess props

The system SHALL accept a required `formId: string` prop on `SignatureForm`, set as the `id` attribute on the `<Form>` element, enabling external submit buttons to target the form via `form={formId}`. The form SHALL NOT render a submit button internally. The system SHALL accept an optional `onSuccess?: () => void` prop, called after the signature is successfully saved.

#### Scenario: External submit button triggers form submission

- **WHEN** a `<Button type="submit" form={formId}>` is rendered outside `SignatureForm` and the user clicks it
- **THEN** the form SHALL validate and, if valid, save the signature and call `onSuccess` if provided

#### Scenario: No onSuccess provided — form saves without error

- **WHEN** the user submits valid signature data and no `onSuccess` prop is passed
- **THEN** the system SHALL persist the signature and show the success toast with no errors

#### Scenario: No submit button inside the form

- **WHEN** `SignatureForm` is rendered
- **THEN** no submit button SHALL be present inside the form element

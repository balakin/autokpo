## Requirements

### Requirement: Entity profile form renders all KPO header fields

The system SHALL render a form containing exactly six fields matching the official KPO template header: PIB, Obveznik (full taxpayer name), Firma-radnje (trading name), Sedište (registered address), Šifra poreskog obveznika, and Šifra delatnosti. All field labels SHALL be in Serbian.

#### Scenario: Form displays all six fields

- **WHEN** the user opens the application
- **THEN** the entity profile form is visible with labeled inputs for PIB, Obveznik, Firma-radnje, Sedište, Šifra poreskog obveznika, and Šifra delatnosti

---

### Requirement: PIB field validates 9-digit format

The system SHALL reject any PIB value that is not exactly 9 numeric digits and SHALL display an inline validation error in Serbian. The PIB form field SHALL use `inputMode="numeric"`, `pattern="[0-9]*"`, and `maxLength={9}` on the `<Input>` element, and SHALL strip non-digit characters on every change event.

#### Scenario: PIB too short

- **WHEN** the user enters fewer than 9 digits in the PIB field and attempts to save
- **THEN** the form SHALL display the error "PIB mora imati tačno 9 cifara" and SHALL NOT persist the profile

#### Scenario: PIB strips non-numeric characters at input time

- **WHEN** the user types or pastes a value containing letters or symbols into the PIB field
- **THEN** non-digit characters SHALL be removed immediately; only digits remain in the field value

#### Scenario: Valid PIB accepted

- **WHEN** the user enters exactly 9 numeric digits in the PIB field
- **THEN** no validation error is shown for the PIB field

#### Scenario: PIB field shows numeric keyboard on mobile

- **WHEN** the user focuses the PIB field on a mobile device
- **THEN** the numeric keyboard SHALL be displayed

#### Scenario: PIB maxLength prevents typing beyond 9 digits

- **WHEN** the PIB field already contains 9 digits and the user types another digit
- **THEN** the field SHALL remain at 9 characters and the new character SHALL be ignored

---

### Requirement: Šifra poreskog obveznika field validates 8-digit Matični broj format

The system SHALL reject any Šifra poreskog obveznika value that is not exactly 8 numeric digits (Matični broj format) and SHALL display an inline validation error in Serbian. The field SHALL use `inputMode="numeric"`, `pattern="[0-9]*"`, and `maxLength={8}` on the `<Input>` element, and SHALL strip non-digit characters on every change event.

#### Scenario: Šifra poreskog obveznika has wrong length

- **WHEN** the user enters a value that is not exactly 8 digits in the Šifra poreskog obveznika field and attempts to save
- **THEN** the form SHALL display the error "Šifra poreskog obveznika mora imati tačno 8 cifara" and SHALL NOT persist the profile

#### Scenario: Šifra poreskog obveznika strips non-digits

- **WHEN** the user types or pastes a value containing non-digit characters into the Šifra poreskog obveznika field
- **THEN** non-digit characters SHALL be removed immediately; only digits remain

#### Scenario: Valid Šifra poreskog obveznika accepted

- **WHEN** the user enters exactly 8 numeric digits in the Šifra poreskog obveznika field
- **THEN** no validation error is shown

#### Scenario: Numeric keyboard for Šifra poreskog obveznika

- **WHEN** the user focuses the Šifra poreskog obveznika field on a mobile device
- **THEN** the numeric keyboard SHALL be displayed

---

### Requirement: Šifra delatnosti field validates 4-digit activity code format

The system SHALL reject any Šifra delatnosti value that is not exactly 4 numeric digits (APR activity classification code) and SHALL display an inline validation error in Serbian. The field SHALL use `inputMode="numeric"`, `pattern="[0-9]*"`, and `maxLength={4}` on the `<Input>` element, and SHALL strip non-digit characters on every change event.

#### Scenario: Šifra delatnosti has wrong length

- **WHEN** the user enters a value that is not exactly 4 digits in the Šifra delatnosti field and attempts to save
- **THEN** the form SHALL display the error "Šifra delatnosti mora imati tačno 4 cifre" and SHALL NOT persist the profile

#### Scenario: Šifra delatnosti strips non-digits

- **WHEN** the user types or pastes a value containing non-digit characters into the Šifra delatnosti field
- **THEN** non-digit characters SHALL be removed immediately; only digits remain

#### Scenario: Valid Šifra delatnosti accepted

- **WHEN** the user enters exactly 4 numeric digits in the Šifra delatnosti field
- **THEN** no validation error is shown

#### Scenario: Numeric keyboard for Šifra delatnosti

- **WHEN** the user focuses the Šifra delatnosti field on a mobile device
- **THEN** the numeric keyboard SHALL be displayed

---

### Requirement: All profile fields are required

The system SHALL require all six profile fields to be non-empty before the profile can be saved. Each empty field SHALL show an inline error in Serbian: "Polje je obavezno".

#### Scenario: Save with empty required field

- **WHEN** the user attempts to save the profile with one or more empty fields
- **THEN** the system SHALL display "Polje je obavezno" next to each empty field and SHALL NOT persist the profile

#### Scenario: Save with all fields filled

- **WHEN** the user fills all six fields with valid values and submits the form
- **THEN** the system SHALL persist the profile and dismiss any validation errors

---

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

---

### Requirement: Profile is accessible to the rest of the application

The system SHALL expose the active book's entity profile through selector and mutation modules scoped to the entity-profile domain. Book-scoped consumers SHALL obtain the route id through `useBookId()`, read the active profile via a `useYDoc` selector, and save changes through a profile mutation that writes the active book's `profile` slice inside one `ydoc.transact(() => { ... })` block.

#### Scenario: Profile available after save

- **WHEN** the user saves a valid profile inside a book
- **THEN** consumers reading the active profile through the entity-profile selector SHALL receive the updated profile object immediately and the change SHALL be persisted to the active book in the Yjs document

#### Scenario: Profile null before first save in a new book

- **WHEN** a freshly created book has `profile: null` and has just been opened
- **THEN** the entity-profile selector SHALL return `null` as the profile value

---

### Requirement: Entity profile form accepts formId and onSuccess props

The system SHALL accept a required `formId: string` prop on `EntityProfileForm`, set as the `id` attribute on the `<Form>` element, enabling external submit buttons to target the form via `form={formId}`. The form SHALL NOT render a submit button internally. The system SHALL accept an optional `onSuccess?: () => void` prop, called after the profile is successfully saved.

#### Scenario: External submit button triggers form submission

- **WHEN** a `<Button type="submit" form={formId}>` is rendered outside `EntityProfileForm` and the user clicks it
- **THEN** the form SHALL validate and, if valid, save the profile and call `onSuccess` if provided

#### Scenario: No onSuccess provided — form saves without error

- **WHEN** the user submits valid entity profile data and no `onSuccess` prop is passed
- **THEN** the system SHALL persist the profile and show the success toast with no errors

#### Scenario: No submit button inside the form

- **WHEN** `EntityProfileForm` is rendered
- **THEN** no submit button SHALL be present inside the form element

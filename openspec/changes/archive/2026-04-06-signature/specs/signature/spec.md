## ADDED Requirements

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

The system SHALL store the signature in `localStorage` under the key `kpo:signature` as a JSON object. On application load, the system SHALL restore both field values from storage if a signature exists.

#### Scenario: Signature restored on reload

- **WHEN** the user has previously saved a valid signature and reloads the page
- **THEN** both signature fields SHALL be pre-populated with the saved values

#### Scenario: No signature in storage

- **WHEN** the user opens the application for the first time
- **THEN** both signature fields SHALL be empty

---

### Requirement: Signature is accessible to the rest of the application

The system SHALL expose the current signature via `SignatureContext` so that the PDF export module can consume it without prop-drilling.

#### Scenario: SignatureContext provides signature after save

- **WHEN** the user saves a valid signature
- **THEN** consumers of `SignatureContext` SHALL receive the updated signature object immediately

#### Scenario: SignatureContext provides null before first save

- **WHEN** no signature has been saved
- **THEN** `SignatureContext` SHALL provide `null` as the signature value

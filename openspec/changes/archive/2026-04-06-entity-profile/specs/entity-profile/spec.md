## ADDED Requirements

### Requirement: Entity profile form renders all KPO header fields

The system SHALL render a form containing exactly six fields matching the official KPO template header: PIB, Obveznik (full taxpayer name), Firma-radnje (trading name), Sedište (registered address), Šifra poreskog obveznika, and Šifra delatnosti. All field labels SHALL be in Serbian.

#### Scenario: Form displays all six fields

- **WHEN** the user opens the application
- **THEN** the entity profile form is visible with labeled inputs for PIB, Obveznik, Firma-radnje, Sedište, Šifra poreskog obveznika, and Šifra delatnosti

---

### Requirement: PIB field validates 9-digit format

The system SHALL reject any PIB value that is not exactly 9 numeric digits and SHALL display an inline validation error in Serbian.

#### Scenario: PIB too short

- **WHEN** the user enters fewer than 9 digits in the PIB field and attempts to save
- **THEN** the form SHALL display the error "PIB mora imati tačno 9 cifara" and SHALL NOT persist the profile

#### Scenario: PIB contains non-numeric characters

- **WHEN** the user enters a value containing letters or symbols in the PIB field and attempts to save
- **THEN** the form SHALL display the error "PIB mora sadržati samo cifre" and SHALL NOT persist the profile

#### Scenario: Valid PIB accepted

- **WHEN** the user enters exactly 9 numeric digits in the PIB field
- **THEN** no validation error is shown for the PIB field

---

### Requirement: Šifra poreskog obveznika field validates 8-digit Matični broj format

The system SHALL reject any Šifra poreskog obveznika value that is not exactly 8 numeric digits (Matični broj format) and SHALL display an inline validation error in Serbian.

#### Scenario: Šifra poreskog obveznika has wrong length

- **WHEN** the user enters a value that is not exactly 8 digits in the Šifra poreskog obveznika field and attempts to save
- **THEN** the form SHALL display the error "Šifra poreskog obveznika mora imati tačno 8 cifara" and SHALL NOT persist the profile

#### Scenario: Valid Šifra poreskog obveznika accepted

- **WHEN** the user enters exactly 8 numeric digits in the Šifra poreskog obveznika field
- **THEN** no validation error is shown for the Šifra poreskog obveznika field

---

### Requirement: Šifra delatnosti field validates 4-digit activity code format

The system SHALL reject any Šifra delatnosti value that is not exactly 4 numeric digits (APR activity classification code) and SHALL display an inline validation error in Serbian.

#### Scenario: Šifra delatnosti has wrong length

- **WHEN** the user enters a value that is not exactly 4 digits in the Šifra delatnosti field and attempts to save
- **THEN** the form SHALL display the error "Šifra delatnosti mora imati tačno 4 cifre" and SHALL NOT persist the profile

#### Scenario: Valid Šifra delatnosti accepted

- **WHEN** the user enters exactly 4 numeric digits in the Šifra delatnosti field
- **THEN** no validation error is shown for the Šifra delatnosti field

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

The system SHALL store the entity profile in `localStorage` under the key `kpo:entity-profile` as a JSON object. On application load, the system SHALL restore all field values from storage if a profile exists.

#### Scenario: Profile restored on reload

- **WHEN** the user has previously saved a valid profile and reloads the page
- **THEN** all six form fields SHALL be pre-populated with the saved values

#### Scenario: No profile in storage

- **WHEN** the user opens the application for the first time (no `kpo:entity-profile` in localStorage)
- **THEN** all form fields SHALL be empty

---

### Requirement: Profile is accessible to the rest of the application

The system SHALL expose the current entity profile via a React context (`EntityProfileContext`) so that the PDF export module and any page header preview can consume it without prop-drilling.

#### Scenario: Profile available after save

- **WHEN** the user saves a valid profile
- **THEN** consumers of `EntityProfileContext` SHALL receive the updated profile object immediately

#### Scenario: Profile null before first save

- **WHEN** no profile has been saved
- **THEN** `EntityProfileContext` SHALL provide `null` as the profile value

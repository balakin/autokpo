## MODIFIED Requirements

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

## MODIFIED Requirements

### Requirement: Application always displays a legal compliance warning

The system SHALL always display a persistent warning in the working layout informing the user that the generated PDF is a draft that must be signed and stamped by the taxpayer themselves (Član 13, stav 2 Pravilnika o poslovnim knjigama). The warning is shown unconditionally in the working layout because the browser opens the document in a new window, making a post-download state change invisible to the user.

#### Scenario: Warning is always visible in working layout

- **WHEN** the user opens the working layout
- **THEN** a warning message SHALL be visible informing the user that the document must be personally signed and stamped (Član 13, stav 2)

#### Scenario: Warning displays in Latin script

- **WHEN** the user views the legal compliance warning
- **THEN** the warning text SHALL be displayed in Latin script as: "Preuzeti dokument je nacrt. Obavezno ga potpišite i overite pečatom (Član 13, stav 2 Pravilnika o poslovnim knjigama)."

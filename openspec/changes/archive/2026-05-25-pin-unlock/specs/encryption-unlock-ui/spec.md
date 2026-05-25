## MODIFIED Requirements

### Requirement: Returning user unlocks encrypted data for current session

The system SHALL provide an unlock path after authentication when an encryption profile exists and encrypted data is locked. If a valid `local_wrapper` with `method: 'ldk'` exists in IndexedDB, the system SHALL auto-unlock without user input. If a valid `local_wrapper` with `method: 'pin'` exists, the system SHALL show the PIN unlock screen. If no local wrapper is present, the system SHALL show the password unlock screen. Successful unlock (via LDK, PIN, or password) SHALL expose the active DEK for the current auth session.

#### Scenario: LDK present — auto-unlock without password prompt

- **WHEN** an authenticated user opens the app
- **AND** a valid `local_wrapper` with `method: 'ldk'` exists in IndexedDB for that user
- **THEN** the system SHALL unwrap the MEK using the LDK
- **AND** the system SHALL decrypt the key ring locally
- **AND** the system SHALL unlock encrypted data for the current auth session without showing any unlock screen

#### Scenario: PIN wrapper present — PIN screen shown

- **WHEN** an authenticated user opens the app
- **AND** a valid `local_wrapper` with `method: 'pin'` exists in IndexedDB for that user
- **THEN** the system SHALL display the PIN unlock screen
- **AND** SHALL NOT display the password unlock screen

#### Scenario: No local wrapper — correct password unlocks app

- **WHEN** an authenticated user opens the app with no local wrapper present
- **AND** the user enters the correct encryption password and submits the unlock form
- **THEN** the system SHALL unwrap the MEK locally
- **AND** the system SHALL decrypt the key ring locally
- **AND** the system SHALL unlock encrypted data for the current auth session with the active DEK
- **AND** proceed to the signed-in app

#### Scenario: Incorrect password stays locked

- **WHEN** the user enters an incorrect encryption password
- **AND** submits the unlock form
- **THEN** the system SHALL keep encrypted data locked
- **AND** display an inline error without clearing the authenticated session

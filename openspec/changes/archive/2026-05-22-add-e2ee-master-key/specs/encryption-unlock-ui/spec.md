## MODIFIED Requirements

### Requirement: Initial backend check runs before showing setup or unlock UI

When no wrapped key is cached locally, the gate SHALL show a loading indicator while fetching the active key record from the backend. The loading indicator is delayed so it does not flash on fast connections.

#### Scenario: Loading indicator appears while checking backend

- **WHEN** the gate starts in the `checking` state (no local cache)
- **THEN** the system SHALL render a spinner after a short delay (≥ 250 ms)
- **AND** SHALL NOT show the setup or unlock screen until the check completes

#### Scenario: Backend check network failure shows retry UI

- **WHEN** the backend check returns a non-404 error
- **THEN** the system SHALL display a "cannot verify encryption" error screen
- **AND** provide a "try again" action that repeats the backend check
- **AND** SHALL NOT navigate to setup or unlock until a check succeeds

### Requirement: First-time setup creates encryption password with acknowledgement

The setup screen SHALL collect an encryption password and confirmation before setup can complete. The user SHALL acknowledge that Autokpo cannot recover the encryption password or encrypted data before proceeding. Successful setup SHALL create and store a real password-wrapped master key for the authenticated user before entering the signed-in app.

#### Scenario: Matching password and acknowledgement complete setup

- **WHEN** the user enters matching encryption password values
- **AND** acknowledges non-recoverability
- **AND** submits the setup form
- **THEN** the system SHALL initialize encryption for the current auth session by creating a browser-generated master key and password wrapping
- **AND** the system SHALL persist the wrapped key record for the authenticated user
- **AND** proceed to the signed-in app

#### Scenario: Missing acknowledgement blocks setup

- **WHEN** the user submits the setup form without acknowledging non-recoverability
- **THEN** the system SHALL keep the user on the setup screen
- **AND** display an inline validation message

#### Scenario: Mismatched confirmation blocks setup

- **WHEN** the user submits different encryption password and confirmation values
- **THEN** the system SHALL keep the user on the setup screen
- **AND** display an inline validation message

### Requirement: Returning user unlocks encrypted data for current session

The system SHALL provide an unlock screen that asks for the encryption password after authentication when an encryption profile exists and encrypted data is locked. Successful unlock SHALL unwrap the persisted master key locally and unlock encrypted data for the current auth session.

#### Scenario: Correct password unlocks app

- **WHEN** the user enters the correct encryption password
- **AND** submits the unlock form
- **THEN** the system SHALL unwrap the master key locally
- **AND** the system SHALL unlock encrypted data for the current auth session
- **AND** proceed to the signed-in app

#### Scenario: Incorrect password stays locked

- **WHEN** the user enters an incorrect encryption password
- **AND** submits the unlock form
- **THEN** the system SHALL keep encrypted data locked
- **AND** display an inline error without clearing the authenticated session

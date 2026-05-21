## MODIFIED Requirements

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

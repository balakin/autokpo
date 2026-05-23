## MODIFIED Requirements

### Requirement: Returning user unlocks encrypted data for current session

The system SHALL provide an unlock path after authentication when an encryption profile exists and encrypted data is locked. If a valid LDK exists in IndexedDB, the system SHALL auto-unlock without showing the password prompt. If no LDK is present, the system SHALL show the unlock screen asking for the encryption password. Successful unlock (via LDK or password) SHALL expose the active DEK for the current auth session.

#### Scenario: LDK present — auto-unlock without password prompt

- **WHEN** an authenticated user opens the app
- **AND** a valid `local_wrapper` with `method: 'ldk'` exists in IndexedDB for that user
- **THEN** the system SHALL unwrap the MEK using the LDK
- **AND** the system SHALL decrypt the key ring locally
- **AND** the system SHALL unlock encrypted data for the current auth session without showing the password unlock screen

#### Scenario: LDK absent — correct password unlocks app

- **WHEN** an authenticated user opens the app with no LDK present
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

## MODIFIED Requirements

### Requirement: Encryption remains unlocked until logout

After setup or unlock succeeds (via password or LDK), the system SHALL keep encrypted data unlocked for the current auth session. Logging out SHALL clear session encryption material — including the `local_wrapper` IndexedDB record — so the encryption password is required again on a later auth session before a new LDK is established.

#### Scenario: Current session remains unlocked

- **WHEN** the user successfully completes setup or unlock (password or LDK)
- **AND** continues using the app without logging out
- **THEN** the system SHALL keep encrypted data unlocked for that auth session

#### Scenario: Logout clears encryption session and LDK

- **WHEN** the user logs out
- **THEN** the system SHALL clear plaintext MEK, plaintext key-ring, and active DEK session material
- **AND** the system SHALL delete the `local_wrapper` IndexedDB record for that user
- **AND** a later authenticated session SHALL require the encryption password before auto-unlock is restored

## Purpose

Define the encryption setup and unlock UI shown after authentication and before signed-in app access.

## Requirements

### Requirement: Encryption shell presents setup and unlock fullscreen

The system SHALL present encryption setup and unlock screens in a fullscreen shell after authentication and before the signed-in app shell. The shell SHALL include the app identity, account-level profile controls, a centered content card, and the app footer without rendering data-backed app navigation.

#### Scenario: First-time setup uses encryption shell

- **WHEN** an authenticated user has no encryption profile
- **THEN** the system SHALL show the encryption setup screen inside the encryption shell
- **AND** the signed-in app shell SHALL NOT be rendered

#### Scenario: Returning unlock uses encryption shell

- **WHEN** an authenticated user has an encryption profile but encrypted data is locked
- **THEN** the system SHALL show the unlock screen inside the encryption shell
- **AND** the signed-in app shell SHALL NOT be rendered

#### Scenario: Shell exposes global preferences

- **WHEN** the encryption shell is displayed
- **THEN** the user SHALL be able to open account-level profile controls without unlocking encrypted data
- **AND** the user SHALL be able to change language and theme from those controls

#### Scenario: Shell exposes logout before unlock

- **WHEN** the encryption shell is displayed
- **THEN** the user SHALL be able to access logout from the account-level profile controls without unlocking encrypted data
- **AND** logout SHALL follow the app's online-only sign-out behavior

### Requirement: First-time setup explains encryption password purpose

The system SHALL provide a first-time setup screen that explains the encryption password is separate from sign-in, unlocks encrypted app data after authentication, and cannot be seen, reset, or recovered by Autokpo.

#### Scenario: Setup explains non-recoverability

- **WHEN** the setup screen is displayed
- **THEN** it SHALL explain that losing the encryption password means encrypted data cannot be restored
- **AND** it SHALL avoid implying that the password can be reset by Autokpo

### Requirement: Initial backend check runs before showing setup or unlock UI

When no encrypted key-ring profile is cached locally, the gate SHALL show a loading indicator while fetching the key-ring profile from the backend. The loading indicator is delayed so it does not flash on fast connections.

#### Scenario: Loading indicator appears while checking backend

- **WHEN** the gate starts in the `checking` state (no local cache)
- **THEN** the system SHALL render a spinner after a short delay (≥ 250 ms)
- **AND** SHALL NOT show the setup or unlock screen until the check completes

#### Scenario: Backend check network failure shows retry UI

- **WHEN** the backend check returns a non-404 error and no encrypted local key-ring cache is usable
- **THEN** the system SHALL display a "cannot verify encryption" error screen
- **AND** provide a "try again" action that repeats the backend check
- **AND** SHALL NOT navigate to setup or unlock until a check succeeds or a network-unavailable cached profile is used

### Requirement: First-time setup creates encryption password with acknowledgement

The setup screen SHALL collect an encryption password and confirmation before setup can complete. The user SHALL acknowledge that Autokpo cannot recover the encryption password or encrypted data before proceeding. Successful setup SHALL create and store a real encrypted key ring and password-wrapped MEK for the authenticated user before entering the signed-in app.

#### Scenario: Matching password and acknowledgement complete setup

- **WHEN** the user enters matching encryption password values
- **AND** acknowledges non-recoverability
- **AND** submits the setup form
- **THEN** the system SHALL initialize encryption for the current auth session by creating a browser-generated MEK, a browser-generated DEK, an encrypted key ring, and a password wrapper
- **AND** the system SHALL persist the encrypted key-ring profile for the authenticated user
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

The system SHALL provide an unlock screen that asks for the encryption password after authentication when an encryption profile exists and encrypted data is locked. Successful unlock SHALL unwrap the persisted MEK locally, decrypt the key ring locally, and unlock encrypted data for the current auth session using the active DEK.

#### Scenario: Correct password unlocks app

- **WHEN** the user enters the correct encryption password
- **AND** submits the unlock form
- **THEN** the system SHALL unwrap the MEK locally
- **AND** the system SHALL decrypt the key ring locally
- **AND** the system SHALL unlock encrypted data for the current auth session with the active DEK
- **AND** proceed to the signed-in app

#### Scenario: Incorrect password stays locked

- **WHEN** the user enters an incorrect encryption password
- **AND** submits the unlock form
- **THEN** the system SHALL keep encrypted data locked
- **AND** display an inline error without clearing the authenticated session

### Requirement: Forgot password path explains non-recovery

The unlock screen SHALL provide a forgot-password path that explains Autokpo cannot recover the encryption password and that encrypted data cannot be restored without it. The MVP forgot-password path SHALL NOT perform destructive reset.

#### Scenario: Forgot password shows explanation

- **WHEN** the user opens the forgot-password path from the unlock screen
- **THEN** the system SHALL explain that the encryption password cannot be recovered by Autokpo
- **AND** it SHALL NOT offer a reset action that deletes encrypted data

### Requirement: Encryption remains unlocked until logout

After setup or unlock succeeds, the system SHALL keep encrypted data unlocked for the current auth session. Logging out SHALL clear session encryption material so the encryption password is required again on a later auth session.

#### Scenario: Current session remains unlocked

- **WHEN** the user successfully completes setup or unlock
- **AND** continues using the app without logging out
- **THEN** the system SHALL keep encrypted data unlocked for that auth session

#### Scenario: Logout clears encryption session

- **WHEN** the user logs out
- **THEN** the system SHALL clear plaintext MEK, plaintext key-ring, and active DEK session material
- **AND** a later authenticated session SHALL require encryption setup or unlock before entering the signed-in app

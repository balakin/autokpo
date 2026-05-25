## ADDED Requirements

### Requirement: PIN verifies master password change when PIN local wrapper is active

When a user with an active PIN local wrapper changes the master password, the system SHALL use the PIN to verify access to the existing MEK before allowing the password change to proceed. This verification SHALL use the stored PIN local wrapper and the same cryptographic unwrap path as PIN unlock.

#### Scenario: Correct PIN authorizes password change verification

- **WHEN** the user starts a master password change
- **AND** the current `local_wrapper` record has `method: 'pin'`
- **AND** the user enters the correct PIN
- **THEN** the system SHALL unwrap the MEK through the PIN wrapper successfully
- **AND** the system SHALL allow the user to continue to new master password entry

#### Scenario: Incorrect PIN counts toward retry limit

- **WHEN** the user enters an incorrect PIN while verifying a master password change
- **THEN** the system SHALL treat the attempt as a failed PIN verification attempt
- **AND** the system SHALL NOT allow the password change to proceed for that attempt

#### Scenario: PIN retry limit during password change clears encryption session

- **WHEN** PIN verification for master password change reaches 10 failed attempts
- **THEN** the system SHALL clear in-memory encryption key material for the current app session
- **AND** the system SHALL require the user to unlock encryption again before accessing Security settings

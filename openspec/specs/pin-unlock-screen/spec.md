## Purpose

Define the PIN unlock screen shown when a `method: 'pin'` local wrapper is present, including the 6-digit input, auto-submit, loading state, error handling, and wipe behavior.

## Requirements

### Requirement: Encryption gate shows PIN screen when PIN wrapper is present

The encryption gate SHALL detect a `method: 'pin'` local wrapper during the initial check and render the PIN unlock screen instead of the password unlock screen.

#### Scenario: PIN wrapper present — PIN screen shown

- **WHEN** an authenticated user opens the app
- **AND** a valid `local_wrapper` with `method: 'pin'` exists in IndexedDB for that user
- **THEN** the system SHALL display the PIN unlock screen
- **AND** SHALL NOT display the password unlock screen

#### Scenario: No local wrapper — password screen shown

- **WHEN** an authenticated user opens the app
- **AND** no `local_wrapper` exists in IndexedDB for that user
- **THEN** the system SHALL display the password unlock screen as before

### Requirement: PIN screen accepts a 6-digit numeric code and auto-submits

The PIN unlock screen SHALL render 6 individual digit input slots. The system SHALL auto-submit when the 6th digit is entered without requiring an explicit submit action.

#### Scenario: Auto-submit on 6th digit

- **WHEN** the user enters the 6th digit of their PIN
- **THEN** the system SHALL immediately begin the unlock attempt
- **AND** SHALL NOT require a separate submit button press

#### Scenario: Non-numeric input is rejected

- **WHEN** the user attempts to enter a non-numeric character
- **THEN** the system SHALL ignore the input
- **AND** the digit slot SHALL remain empty

### Requirement: PIN screen shows loading state during Argon2id derivation

After auto-submit, the PIN screen SHALL display a visible loading indicator while the KDF worker is running. The digit inputs SHALL be disabled during derivation.

#### Scenario: Loading state during KDF

- **WHEN** the PIN has been submitted and Argon2id is running
- **THEN** the system SHALL display a loading indicator
- **AND** digit inputs SHALL be disabled until the attempt resolves

### Requirement: PIN screen shows error on wrong PIN and updates attempt counter

On a failed unlock attempt, the PIN screen SHALL display an inline error and clear the entered digits. The remaining allowed attempts SHALL be visible when 5 or fewer remain.

#### Scenario: Wrong PIN shows inline error

- **WHEN** the user enters an incorrect PIN
- **THEN** the system SHALL display an inline error message
- **AND** SHALL clear all digit slots so the user can try again

#### Scenario: Remaining attempts shown when 5 or fewer left

- **WHEN** `failedAttempts` is 5 or greater after a failed attempt
- **THEN** the system SHALL display the number of remaining attempts to the user

### Requirement: PIN screen wipe redirects to password unlock

When the PIN wrapper is deleted after 10 failed attempts, the encryption gate SHALL transition to the password unlock screen.

#### Scenario: After wipe — password screen shown

- **WHEN** the 10th PIN attempt fails and the wrapper is deleted
- **THEN** the system SHALL display the password unlock screen
- **AND** a message SHALL inform the user that the PIN has been removed

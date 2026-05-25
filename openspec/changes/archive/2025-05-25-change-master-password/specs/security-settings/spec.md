## ADDED Requirements

### Requirement: Security settings provides master password change modal

The Security settings tab SHALL provide a Change master password action that opens a modal while the user's encryption session is unlocked. The modal SHALL guide the user through verification, new password entry, submission, and completion.

#### Scenario: Change password action opens modal

- **WHEN** an authenticated user with an unlocked encryption session opens Settings → Security
- **THEN** the Security tab SHALL show a Change master password action
- **WHEN** the user activates the action
- **THEN** the system SHALL open the Change master password modal

#### Scenario: Modal is unavailable before encryption unlock

- **WHEN** the encryption session is locked
- **THEN** the Security settings content SHALL NOT allow submitting a master password change

### Requirement: Password change modal verifies user before accepting new password

The Change master password modal SHALL require fresh verification before submitting a new master password. If the current local wrapper is `method: 'pin'`, the modal SHALL ask for the PIN. Otherwise, the modal SHALL ask for the current master password.

#### Scenario: PIN users verify with PIN

- **WHEN** the user opens the Change master password modal
- **AND** the current `local_wrapper` record has `method: 'pin'`
- **THEN** the modal SHALL ask the user to enter the PIN
- **AND** the modal SHALL NOT require the current master password for verification

#### Scenario: Non-PIN users verify with current master password

- **WHEN** the user opens the Change master password modal
- **AND** no PIN local wrapper is active for the user
- **THEN** the modal SHALL ask the user to enter the current master password

#### Scenario: Successful verification proceeds to new password entry

- **WHEN** the user provides a valid PIN or current master password for verification
- **THEN** the modal SHALL allow entry of the new master password and confirmation

### Requirement: Password change modal enforces validation and retry limits

The Change master password modal SHALL reuse the existing master-password validation rules for the new password and SHALL allow the same value as the current password. The verification step SHALL allow at most 10 failed attempts before clearing the encryption session.

#### Scenario: Invalid new password is rejected

- **WHEN** the user enters a new master password that fails existing master-password validation rules
- **THEN** the modal SHALL show an inline validation error
- **AND** the system SHALL NOT submit the change-password request

#### Scenario: Matching confirmation is required

- **WHEN** the user enters a valid new master password and a different confirmation value
- **THEN** the modal SHALL show an inline validation error
- **AND** the system SHALL NOT submit the change-password request

#### Scenario: Ten failed verification attempts clear encryption session

- **WHEN** the user fails PIN or current-password verification 10 times in the Change master password modal
- **THEN** the system SHALL clear in-memory encryption key material for the current app session
- **AND** the system SHALL require the user to unlock encryption again
- **AND** the system SHALL NOT sign the user out solely because of these failed attempts

### Requirement: Successful password change shows success and refreshes profile

The Security settings flow SHALL show a success toast after the server accepts the master password change and the client completes its key-ring profile refresh.

#### Scenario: Success closes modal and shows toast

- **WHEN** the change-password request succeeds
- **AND** the client refetches the key-ring profile successfully
- **THEN** the modal SHALL close
- **AND** the Security settings page SHALL show a success toast

#### Scenario: Success followed by refetch error surfaces error

- **WHEN** the change-password request succeeds
- **AND** the subsequent key-ring profile refetch fails
- **THEN** the system SHALL show the current key-ring fetch error state
- **AND** the system SHALL NOT claim local unlock wrappers were changed

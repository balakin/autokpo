## Purpose

Define the Security settings tab at `/settings/security`, including display of the current local unlock method and actions to set, change, or switch the PIN or LDK wrapper.

## Requirements

### Requirement: Settings has a Security tab at /settings/security

The Settings area SHALL include a third route-backed tab labeled "Security" at `/settings/security` alongside the existing General and Account tabs.

#### Scenario: Security tab is reachable from Settings

- **WHEN** the user navigates to `/settings/security`
- **THEN** the Settings area SHALL render the Security tab as selected
- **AND** the Security tab content SHALL be visible

#### Scenario: Settings tabs show all three options

- **WHEN** the user is on any Settings tab
- **THEN** the tab navigation SHALL display tabs for General, Account, and Security

### Requirement: Security tab shows current local unlock method

The Security tab SHALL display the current local unlock method — either LDK auto-unlock or PIN code — and provide actions appropriate to the current state.

#### Scenario: LDK method — switch-to-PIN action shown

- **WHEN** the `local_wrapper` record has `method: 'ldk'` (or no local wrapper exists)
- **THEN** the Security tab SHALL indicate that auto-unlock is active
- **AND** SHALL show a "Set PIN code" action

#### Scenario: PIN method — change and remove actions shown

- **WHEN** the `local_wrapper` record has `method: 'pin'`
- **THEN** the Security tab SHALL indicate that PIN unlock is active
- **AND** SHALL show a "Change PIN" action and a "Switch to auto-unlock" action

### Requirement: Setting a PIN opens a modal and replaces the LDK wrapper

Activating "Set PIN code" SHALL open a modal where the user enters and confirms a 6-digit PIN. On successful submission the system SHALL wrap the MEK with the new PIN wrapper and replace the existing local wrapper.

#### Scenario: Set PIN modal accepts matching 6-digit PINs

- **WHEN** the user enters a 6-digit PIN and confirms it with the same value
- **AND** submits the modal
- **THEN** the system SHALL create a new PIN wrapper and store it as the `local_wrapper`
- **AND** close the modal
- **AND** update the Security tab to reflect PIN method

#### Scenario: Set PIN modal rejects mismatched confirmation

- **WHEN** the user enters a PIN and a different confirmation value
- **THEN** the system SHALL display an inline validation error
- **AND** SHALL NOT create a wrapper

#### Scenario: Set PIN modal rejects fewer than 6 digits

- **WHEN** the user submits with fewer than 6 digits entered
- **THEN** the system SHALL display an inline validation error
- **AND** SHALL NOT create a wrapper

### Requirement: Changing a PIN replaces the existing PIN wrapper

Activating "Change PIN" SHALL open the same 6-digit modal. On successful submission the existing PIN wrapper SHALL be replaced atomically with the new one. No current-PIN confirmation is required since the session is already unlocked.

#### Scenario: Change PIN replaces wrapper

- **WHEN** the user submits a valid new PIN via the Change PIN modal
- **THEN** the system SHALL generate a new PIN wrapper with a new `wrapperId`, new `pinLdk`, and new salt
- **AND** write it to `local_wrapper`, replacing the old PIN wrapper
- **AND** `createdAt` SHALL reflect the new creation time

### Requirement: Switching to auto-unlock replaces PIN wrapper with LDK

Activating "Switch to auto-unlock" SHALL immediately generate a new LDK, wrap the MEK, and store a `method: 'ldk'` record, replacing the PIN wrapper. No confirmation modal is required.

#### Scenario: Switch to auto-unlock updates wrapper

- **WHEN** the user activates "Switch to auto-unlock"
- **THEN** the system SHALL generate a new LDK wrapper and write it to `local_wrapper`
- **AND** the Security tab SHALL update to reflect LDK method
- **AND** the next app reload SHALL auto-unlock without showing a PIN screen

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

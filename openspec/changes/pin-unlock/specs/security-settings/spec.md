## ADDED Requirements

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

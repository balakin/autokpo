## ADDED Requirements

### Requirement: Unlocked master key is available to the sync engine via context

The system SHALL provide the unlocked master key and its key id to the React subtree via an `EncryptionContext`. `EncryptionGate` SHALL be the context provider, exposing `{ masterKey: Uint8Array; keyId: string }` once the session is unlocked. Any component or hook within the subtree MAY consume this context to perform encryption and decryption operations.

#### Scenario: Context is populated after unlock

- **WHEN** the user successfully unlocks encryption (setup or unlock flow)
- **THEN** `EncryptionContext` SHALL provide a non-null `masterKey` and `keyId` to all children of `EncryptionGate`

#### Scenario: Context is not accessible before unlock

- **WHEN** the encryption session is locked or uninitialized
- **THEN** `EncryptionGate` SHALL NOT render its children
- **AND** `EncryptionContext` SHALL NOT be accessible to any sync engine code

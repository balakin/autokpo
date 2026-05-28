## MODIFIED Requirements

### Requirement: Backend stores key ring and active wrapper metadata

The system SHALL persist one key ring per authenticated user and password wrapper metadata without receiving password plaintext, KEK bytes, plaintext MEK bytes, plaintext DEK bytes, or plaintext key-ring JSON. Key-ring setup SHALL persist the key-ring row and initial active password wrapper in one atomic D1 batch, relying on database constraints rather than a preflight existence check as the authority for duplicate setup races.

#### Scenario: Setup stores key ring and password wrapper

- **WHEN** setup saves the key-ring profile
- **THEN** the backend SHALL create one `key_ring` row for the authenticated user
- **AND** the backend SHALL store `activeDekId`, `revision`, `encryptionAlgorithm`, `encryptionParams` (containing `iv` and `tagBits`), and encrypted key-ring `ciphertext`
- **AND** the backend SHALL NOT store a separate `encryptionVersion` or `iv` field outside `encryptionParams`
- **AND** the backend SHALL initialize `revision` to `1`
- **AND** the backend SHALL create one `key_ring_wrapping` row with method `password` and status `active`
- **AND** the backend SHALL store the frontend-provided wrapper id without replacing it
- **AND** the backend SHALL store KDF algorithm, KDF params, KDF salt, wrapping algorithm, `wrappingParams` (containing `iv` and `tagBits`), and wrapped MEK `ciphertext`
- **AND** the backend SHALL NOT store separate `wrappingVersion`, `wrappingIv`, or `kdfVersion` fields
- **AND** the backend SHALL persist the key-ring row and password-wrapper row atomically so neither row remains without the other after a failed setup write
- **AND** the backend SHALL NOT store the encryption password, KEK, plaintext MEK, plaintext DEK, or plaintext key ring

#### Scenario: Duplicate setup is rejected

- **WHEN** an authenticated user already has a key ring
- **AND** the user submits another key-ring setup request
- **THEN** the backend SHALL reject the request with a conflict error
- **AND** the backend SHALL NOT rely on a preflight existence read as the authority for duplicate prevention

### Requirement: Password-derived KEK wraps MEK locally

The system SHALL derive a KEK from the encryption password locally and use it to wrap the MEK before persistence. The wrapped MEK SHALL use AES-256-GCM with a random wrapping IV and AAD bound to the user id, wrapper id, and wrapper method.

#### Scenario: Setup wraps MEK with password-derived KEK

- **WHEN** the user completes encryption setup
- **THEN** the system SHALL derive a KEK using Argon2id with stored versioned parameters and a random salt
- **AND** the browser SHALL generate a wrapper id before wrapping the MEK
- **AND** the system SHALL encrypt the MEK using AES-256-GCM with a random IV stored inside `wrappingParams`
- **AND** the system SHALL use AAD `autokpo:e2ee-wrapped-mek:v1:{userId}:{wrapperId}:{method}`
- **AND** the wrapper record SHALL NOT contain a standalone `wrappingIv` field

# e2ee-key-ring Specification

## Purpose

TBD - created by archiving change key-ring. Update Purpose after archive.

## Requirements

### Requirement: Browser creates encrypted key ring during setup

The system SHALL create a browser-side E2EE key ring when an authenticated user completes first-time encryption setup. The browser SHALL generate a random MEK and a random DEK, store the raw DEK bytes as a base64 value inside a plaintext key-ring `deks` map keyed by DEK id, encrypt the key ring with the MEK, and never send plaintext MEK or DEK bytes to the backend. The plaintext DEK entry SHALL NOT duplicate encryption algorithm, version, or IV metadata because that metadata belongs to each encrypted payload/envelope.

#### Scenario: Setup creates MEK, DEK, and encrypted key ring

- **WHEN** an authenticated user submits a valid encryption setup password and acknowledgement
- **THEN** the browser SHALL generate a random MEK
- **AND** the browser SHALL generate a random DEK
- **AND** the browser SHALL create a plaintext key ring containing exactly one DEK map entry whose value is the base64 raw DEK bytes
- **AND** the browser SHALL set the key ring `activeDekId` to that DEK id
- **AND** the browser SHALL encrypt the plaintext key ring with the MEK before persistence
- **AND** the backend SHALL NOT receive plaintext MEK or DEK bytes

### Requirement: Password-derived KEK wraps MEK locally

The system SHALL derive a KEK from the encryption password locally and use it to wrap the MEK before persistence. The wrapped MEK SHALL use AES-256-GCM with a random wrapping IV and AAD bound to the user id, wrapper id, and wrapper method.

#### Scenario: Setup wraps MEK with password-derived KEK

- **WHEN** the user completes encryption setup
- **THEN** the system SHALL derive a KEK using Argon2id with stored versioned parameters and a random salt
- **AND** the browser SHALL generate a wrapper id before wrapping the MEK
- **AND** the system SHALL encrypt the MEK using AES-256-GCM with a random `wrappingIv`
- **AND** the system SHALL use AAD `autokpo:e2ee-wrapped-mek:v1:{userId}:{wrapperId}:{method}`

### Requirement: Backend stores key ring and active wrapper metadata

The system SHALL persist one key ring per authenticated user and password wrapper metadata without receiving password plaintext, KEK bytes, plaintext MEK bytes, plaintext DEK bytes, or plaintext key-ring JSON.

#### Scenario: Setup stores key ring and password wrapper

- **WHEN** setup saves the key-ring profile
- **THEN** the backend SHALL create one `key_ring` row for the authenticated user
- **AND** the backend SHALL store `activeDekId`, `encryptionAlgorithm`, `encryptionVersion`, `iv`, and encrypted key-ring `ciphertext`
- **AND** the backend SHALL create one `key_ring_wrapping` row with method `password` and status `active`
- **AND** the backend SHALL store the frontend-provided wrapper id without replacing it
- **AND** the backend SHALL store KDF parameters, KDF salt, wrapping algorithm, wrapping version, `wrappingIv`, and wrapped MEK `ciphertext`
- **AND** the backend SHALL NOT store the encryption password, KEK, plaintext MEK, plaintext DEK, or plaintext key ring

#### Scenario: Duplicate setup is rejected

- **WHEN** an authenticated user already has a key ring
- **AND** the user submits another key-ring setup request
- **THEN** the backend SHALL reject the request with a conflict error

### Requirement: Wrapper lifecycle state is stored and constrained

The system SHALL store wrapper lifecycle state with statuses `active` and `revoked`. The database SHALL enforce at most one active wrapper for each authenticated user and wrapper method.

#### Scenario: One active wrapper per method

- **WHEN** the backend stores an active wrapper for a user and method
- **THEN** the database SHALL reject any second active wrapper for the same user and method
- **AND** the database SHALL allow revoked wrappers for the same user and method

#### Scenario: Active wrappers are returned without lifecycle state

- **WHEN** the client fetches the key-ring profile
- **THEN** the backend SHALL return only active wrappers
- **AND** the backend SHALL return at most one wrapper per method
- **AND** the response SHALL include wrapper `id` for decrypting AAD-bound wrapped MEK ciphertext
- **AND** the response SHALL NOT include wrapper `status` or `revokedAt`

### Requirement: Unlock decrypts key ring locally

The system SHALL unlock encryption by deriving the KEK locally, unwrapping the MEK locally, decrypting the key ring locally, and exposing the active DEK for the current app session.

#### Scenario: Correct password unlocks active DEK

- **WHEN** an authenticated user provides the correct encryption password
- **AND** an active password wrapper and encrypted key ring are available
- **THEN** the system SHALL derive the KEK locally
- **AND** the system SHALL decrypt the wrapped MEK locally using the wrapper id and method in AAD
- **AND** the system SHALL decrypt the key ring locally using the MEK
- **AND** the system SHALL read the active DEK's raw key bytes from the decrypted key ring by `activeDekId`
- **AND** the system SHALL keep plaintext MEK, plaintext key ring, and active DEK material in memory only for the current unlocked app session

#### Scenario: Incorrect password does not unlock key ring

- **WHEN** an authenticated user provides an incorrect encryption password
- **THEN** AES-GCM unwrap of the MEK SHALL fail
- **AND** the system SHALL keep encryption locked
- **AND** the system SHALL NOT clear the authenticated session

### Requirement: Key ring cache stores encrypted profile only

The system SHALL cache only the encrypted key-ring profile locally. The cache SHALL contain encrypted key-ring metadata/ciphertext and active wrapper metadata/ciphertext, and SHALL NOT contain plaintext MEK, plaintext DEK, or plaintext key-ring JSON.

#### Scenario: Successful fetch updates encrypted cache

- **WHEN** the backend returns a key-ring profile
- **THEN** the system SHALL cache the encrypted key-ring profile in localStorage for the authenticated user
- **AND** the cached profile SHALL include the encrypted key ring and active wrappers needed for a later unlock attempt

#### Scenario: Network-unavailable unlock may use encrypted cache

- **WHEN** the backend key-ring endpoint is unavailable due to offline or network failure
- **AND** a cached encrypted key-ring profile exists for the authenticated user
- **THEN** the system MAY use the cached encrypted profile for unlock
- **AND** the user SHALL still provide the encryption password to unwrap the MEK

#### Scenario: Non-network backend results do not fall back to cache

- **WHEN** the backend key-ring request returns an authentication, not-found, conflict, validation, or contract error
- **THEN** the system SHALL NOT use the local encrypted cache as a fallback for that result

### Requirement: Key ring AAD binds ciphertext to user and active DEK

The system SHALL use AES-256-GCM AAD for encrypted key-ring ciphertext constructed as `autokpo:e2ee-key-ring:v1:{userId}:{activeDekId}`.

#### Scenario: Key ring ciphertext is bound to user and active DEK

- **WHEN** the browser encrypts or decrypts key-ring ciphertext
- **THEN** it SHALL use the MEK, the key-ring IV, and AAD `autokpo:e2ee-key-ring:v1:{userId}:{activeDekId}`
- **AND** ciphertext moved to another user or active DEK id SHALL fail AES-GCM authentication

### Requirement: Active DEK is exposed to encrypted app code

The system SHALL expose the unlocked active DEK and active DEK id to encrypted app code after setup or unlock succeeds.

#### Scenario: Encryption context exposes active DEK

- **WHEN** setup or unlock succeeds
- **THEN** the encryption context SHALL provide a non-null active DEK and active DEK id to its subtree
- **AND** the context SHALL NOT expose plaintext key material before setup or unlock succeeds

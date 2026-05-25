## ADDED Requirements

### Requirement: Master password change replaces only the active password wrapper

The system SHALL allow an authenticated user with an unlocked encryption session to change the master password by wrapping the existing MEK with a KEK derived from the new password. The password change SHALL NOT rotate the MEK, rotate the active DEK, modify the encrypted key-ring ciphertext, or modify local unlock wrappers.

#### Scenario: Client creates a new wrapper for the existing MEK

- **WHEN** the user submits a valid master password change request from an unlocked encryption session
- **THEN** the browser SHALL derive a KEK from the new master password using the supported Argon2id parameters and a new random salt
- **AND** the browser SHALL generate a new password wrapper id and random wrapping IV
- **AND** the browser SHALL wrap the existing in-memory MEK with AES-256-GCM using AAD `autokpo:e2ee-wrapped-mek:v1:{userId}:{wrapperId}:password`
- **AND** the browser SHALL NOT generate a new MEK or DEK
- **AND** the browser SHALL NOT modify the local `local_wrapper` record

#### Scenario: Same password value is allowed

- **WHEN** the user submits a new master password equal to the current master password
- **THEN** the system SHALL allow the change if the password satisfies the existing master-password validation rules
- **AND** the system SHALL still create a new password wrapper with new salt, IV, and wrapper id

### Requirement: Backend atomically changes the active password wrapper

The backend SHALL expose `POST /api/e2ee/key-ring/change-password` to atomically replace the active password wrapper for the authenticated user. The request SHALL include `currentWrappingId` and the new wrapper metadata/ciphertext. The backend SHALL revoke the current active password wrapper and insert the new active password wrapper in one transaction only when the active wrapper id matches `currentWrappingId`.

#### Scenario: Matching current wrapper is replaced

- **WHEN** an authenticated user submits a valid change-password request
- **AND** `currentWrappingId` matches the user's active password wrapper
- **THEN** the backend SHALL mark the matched wrapper as `revoked` and set `revokedAt`
- **AND** the backend SHALL insert the new password wrapper with method `password` and status `active`
- **AND** the backend SHALL preserve the existing `key_ring` row and encrypted key-ring ciphertext
- **AND** the backend SHALL return a success response without returning the full key-ring profile

#### Scenario: Stale current wrapper is rejected

- **WHEN** an authenticated user submits a change-password request
- **AND** `currentWrappingId` does not match the user's active password wrapper
- **THEN** the backend SHALL reject the request with a conflict response
- **AND** the backend SHALL NOT revoke the active password wrapper
- **AND** the backend SHALL NOT insert the submitted wrapper as active

#### Scenario: Replacement keeps one active password wrapper

- **WHEN** a password wrapper replacement succeeds
- **THEN** the backend SHALL have exactly one active password wrapper for the authenticated user and password method
- **AND** previous password wrappers for that user and method SHALL remain stored only as revoked wrappers

### Requirement: Change-password endpoint validates wrapper parameters

The change-password endpoint SHALL validate the submitted wrapper's public structure and supported cryptographic parameters. The backend SHALL NOT require or receive the plaintext master password, KEK, MEK, DEK, or plaintext key-ring JSON.

#### Scenario: Invalid wrapper parameters are rejected

- **WHEN** an authenticated user submits a change-password request with unsupported KDF parameters, unsupported wrapping parameters, invalid UUIDs, invalid base64, or incorrect salt/IV/ciphertext lengths
- **THEN** the backend SHALL reject the request with a validation error
- **AND** the backend SHALL NOT change the active password wrapper

#### Scenario: Backend does not verify plaintext MEK

- **WHEN** an authenticated user submits a structurally valid new password wrapper
- **THEN** the backend SHALL persist the wrapper without decrypting the ciphertext
- **AND** the backend SHALL NOT receive the plaintext MEK or KEK needed to verify the ciphertext contents

### Requirement: Client refetches key-ring profile after password change

After a successful password change, the client SHALL refetch the key-ring profile through the existing key-ring fetch path so the local encrypted cache stores the new active password wrapper.

#### Scenario: Successful change refreshes cached server wrapper

- **WHEN** the change-password endpoint returns success
- **THEN** the client SHALL request the latest key-ring profile
- **AND** the client SHALL update the local encrypted key-ring and password wrapper cache from the fetched profile
- **AND** the client SHALL leave the local unlock wrapper unchanged

#### Scenario: Refetch failure uses existing error handling

- **WHEN** the change-password endpoint returns success
- **AND** the subsequent key-ring profile refetch fails
- **THEN** the client SHALL surface the error using the current key-ring fetch error handling
- **AND** a later unlock SHALL use the latest server password wrapper when the key-ring profile is fetched successfully

### Requirement: Stale wrapper conflict clears encryption session

The client SHALL clear the unlocked encryption session when the change-password endpoint reports that `currentWrappingId` is stale or wrong. The authenticated account session SHALL remain active.

#### Scenario: Conflict clears encryption and refetches profile

- **WHEN** the change-password endpoint rejects the request because `currentWrappingId` is stale or wrong
- **THEN** the client SHALL clear in-memory encryption key material for the current app session
- **AND** the client SHALL refetch the key-ring profile
- **AND** the client SHALL require the user to unlock encryption again
- **AND** the client SHALL NOT sign the user out solely because of this conflict

## MODIFIED Requirements

### Requirement: Backend stores key ring and active wrapper metadata

The system SHALL persist one key ring per authenticated user and password wrapper metadata without receiving password plaintext, KEK bytes, plaintext MEK bytes, plaintext DEK bytes, or plaintext key-ring JSON. Key-ring setup SHALL persist the key-ring row and initial active password wrapper in one atomic D1 batch, relying on database constraints rather than a preflight existence check as the authority for duplicate setup races.

#### Scenario: Setup stores key ring and password wrapper

- **WHEN** setup saves the key-ring profile
- **THEN** the backend SHALL create one `key_ring` row for the authenticated user
- **AND** the backend SHALL store `activeDekId`, `encryptionAlgorithm`, `encryptionVersion`, `iv`, and encrypted key-ring `ciphertext`
- **AND** the backend SHALL create one `key_ring_wrapping` row with method `password` and status `active`
- **AND** the backend SHALL store the frontend-provided wrapper id without replacing it
- **AND** the backend SHALL store KDF parameters, KDF salt, wrapping algorithm, wrapping version, `wrappingIv`, and wrapped MEK `ciphertext`
- **AND** the backend SHALL persist the key-ring row and password-wrapper row atomically so neither row remains without the other after a failed setup write
- **AND** the backend SHALL NOT store the encryption password, KEK, plaintext MEK, plaintext DEK, or plaintext key ring

#### Scenario: Duplicate setup is rejected

- **WHEN** an authenticated user already has a key ring
- **AND** the user submits another key-ring setup request
- **THEN** the backend SHALL reject the request with a conflict error
- **AND** the backend SHALL NOT rely on a preflight existence read as the authority for duplicate prevention

### Requirement: Backend atomically changes the active password wrapper

The backend SHALL expose `POST /api/e2ee/key-ring/change-password` to atomically replace the active password wrapper for the authenticated user. The request SHALL include `currentWrappingId` and the new wrapper metadata/ciphertext. The backend SHALL revoke the current active password wrapper and insert the new active password wrapper in one atomic D1 batch only when the active wrapper id matches `currentWrappingId`.

#### Scenario: Matching current wrapper is replaced

- **WHEN** an authenticated user submits a valid change-password request
- **AND** `currentWrappingId` matches the user's active password wrapper
- **THEN** the backend SHALL mark the matched wrapper as `revoked` and set `revokedAt`
- **AND** the backend SHALL assert inside the D1 batch that the matched wrapper was revoked before inserting the replacement wrapper
- **AND** the backend SHALL insert the new password wrapper with method `password` and status `active`
- **AND** the backend SHALL preserve the existing `key_ring` row and encrypted key-ring ciphertext
- **AND** the backend SHALL return a success response without returning the full key-ring profile

#### Scenario: Stale current wrapper is rejected

- **WHEN** an authenticated user submits a change-password request
- **AND** `currentWrappingId` does not match the user's active password wrapper
- **THEN** the backend SHALL reject the request with a conflict response
- **AND** the backend SHALL NOT revoke the active password wrapper
- **AND** the backend SHALL NOT insert the submitted wrapper as active
- **AND** any partial wrapper mutation attempted in the same D1 batch SHALL be rolled back

#### Scenario: Replacement keeps one active password wrapper

- **WHEN** a password wrapper replacement succeeds
- **THEN** the backend SHALL have exactly one active password wrapper for the authenticated user and password method
- **AND** previous password wrappers for that user and method SHALL remain stored only as revoked wrappers

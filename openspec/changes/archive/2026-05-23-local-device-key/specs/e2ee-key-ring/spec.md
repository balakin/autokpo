## MODIFIED Requirements

### Requirement: Key ring cache stores encrypted profile only

The system SHALL cache only the encrypted key-ring profile locally. The cache SHALL contain encrypted key-ring metadata/ciphertext and active wrapper metadata/ciphertext, and SHALL NOT contain plaintext MEK, plaintext DEK, or plaintext key-ring JSON. The cache SHALL be stored in the `key_ring` and `wrapper` IndexedDB object stores in the `autokpo-e2ee` database, replacing the previous localStorage cache.

#### Scenario: Successful fetch updates encrypted cache

- **WHEN** the backend returns a key-ring profile
- **THEN** the system SHALL write the encrypted key-ring record to the `key_ring` IndexedDB object store for the authenticated user
- **AND** the system SHALL write the password wrapper fields to the `wrapper` IndexedDB object store for the authenticated user
- **AND** the cached records SHALL include the encrypted key ring and active wrapper needed for a later unlock attempt

#### Scenario: Network-unavailable unlock may use encrypted cache

- **WHEN** the backend key-ring endpoint is unavailable due to offline or network failure
- **AND** a cached encrypted key-ring record exists in IndexedDB for the authenticated user
- **THEN** the system MAY use the cached encrypted record for unlock
- **AND** the user SHALL still provide the encryption password to unwrap the MEK if no LDK is present

#### Scenario: Non-network backend results do not fall back to cache

- **WHEN** the backend key-ring request returns an authentication, not-found, conflict, validation, or contract error
- **THEN** the system SHALL NOT use the local encrypted IndexedDB cache as a fallback for that result

#### Scenario: Password wrapper is cached locally after first unlock

- **WHEN** the user successfully unlocks encryption with a password
- **AND** the `wrapper` IndexedDB store is empty for that user
- **THEN** the system SHALL persist the password wrapper fields from the server response into the `wrapper` store
- **AND** subsequent offline unlock attempts SHALL use the locally cached `wrapper` record

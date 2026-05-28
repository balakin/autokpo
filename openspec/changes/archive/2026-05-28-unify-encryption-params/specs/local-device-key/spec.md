## MODIFIED Requirements

### Requirement: LDK is generated and stored on first password unlock per session

The system SHALL generate a random non-extractable AES-256-GCM Local Device Key (LDK) after the first successful password unlock on a device. The LDK SHALL wrap the MEK using AES-256-GCM with a random IV. Both the LDK CryptoKey and the LDK-wrapped MEK ciphertext SHALL be stored together in the `local_wrapper` IndexedDB object store with `method: 'ldk'`. The wrapping IV SHALL be stored inside a `wrappingParams` object alongside `tagBits`; no standalone `wrappingIv` field SHALL exist on the record.

#### Scenario: First password unlock stores LDK wrapper

- **WHEN** the user successfully unlocks encryption with a password on a device
- **THEN** the system SHALL generate a random non-extractable AES-256-GCM CryptoKey as the LDK
- **AND** the system SHALL wrap the MEK with the LDK using AES-256-GCM with a random IV and AAD bound to userId and wrapperId
- **AND** the system SHALL store the LDK CryptoKey and LDK-wrapped MEK ciphertext in `local_wrapper` with `method: 'ldk'`
- **AND** the record SHALL contain `wrappingParams: { iv: <Uint8Array>, tagBits: 128 }` instead of a standalone `wrappingIv` field
- **AND** the plaintext MEK SHALL NOT be stored anywhere in IndexedDB

#### Scenario: LDK wrapper uses AAD bound to user and wrapper

- **WHEN** the browser wraps or unwraps the MEK with the LDK
- **THEN** it SHALL use AAD `autokpo:e2ee-wrapped-mek:v1:{userId}:{wrapperId}:ldk`
- **AND** ciphertext moved to another user or wrapper id SHALL fail AES-GCM authentication

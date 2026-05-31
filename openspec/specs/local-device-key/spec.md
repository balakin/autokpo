# local-device-key Specification

## Purpose

TBD - created by archiving change local-device-key. Update Purpose after archive.

## Requirements

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

### Requirement: Device auto-unlocks when LDK is present

The system SHALL attempt to auto-unlock encryption using the LDK before showing the password prompt. If a valid `local_wrapper` with `method: 'ldk'` exists in IndexedDB for the authenticated user, the system SHALL use it to unwrap the MEK and decrypt the key ring without user input.

#### Scenario: LDK present — auto-unlock on session load

- **WHEN** an authenticated user opens the app
- **AND** a valid `local_wrapper` with `method: 'ldk'` exists in IndexedDB for that user
- **THEN** the system SHALL unwrap the MEK using the LDK
- **AND** decrypt the key ring to obtain the active DEK
- **AND** enter the unlocked state without showing the password prompt

#### Scenario: LDK absent — fall through to password unlock

- **WHEN** an authenticated user opens the app
- **AND** no `local_wrapper` exists in IndexedDB for that user
- **THEN** the system SHALL proceed to the normal password unlock path

#### Scenario: LDK unwrap fails — fall through to password unlock

- **WHEN** the LDK unwrap or key ring decryption fails (e.g. MEK was rotated)
- **THEN** the system SHALL clear the stale `local_wrapper` record
- **AND** proceed to the password unlock path

### Requirement: LDK is deleted on logout

The system SHALL delete the `local_wrapper` record for the authenticated user from IndexedDB on logout via the async `clearLocalEncryptionUnlockMaterial` helper. The E2EE IndexedDB database SHALL NOT contain remote `wrapper` or `key_ring` records to preserve on logout; encrypted key-ring/profile fallback is handled by protected service-worker runtime caches seeded by `cacheKeyRingProfile`.

#### Scenario: Logout removes local_wrapper

- **WHEN** the user logs out
- **THEN** `cleanupSignedOutSession` SHALL call `clearLocalEncryptionUnlockMaterial(userId)`, which awaits the IndexedDB `clearSessionData` operation
- **AND** a later authenticated session SHALL require the encryption password before auto-unlock is restored

#### Scenario: Next session after logout requires password

- **WHEN** the user logs in after a previous logout
- **AND** no `local_wrapper` exists for that user
- **THEN** the system SHALL show the password unlock screen
- **AND** after successful password unlock SHALL generate a new LDK and store a new `local_wrapper`

### Requirement: local_wrapper schema supports future PIN method

The `local_wrapper` IndexedDB object store SHALL use a `method` field to distinguish unlock methods. The store SHALL support `method: 'ldk'` and `method: 'pin'` records. At most one record SHALL exist per user at any time — setting a PIN wrapper replaces any existing LDK wrapper, and switching back to LDK replaces any existing PIN wrapper. The store keyPath SHALL remain `userId`.

#### Scenario: local_wrapper record has method field

- **WHEN** the system writes a `local_wrapper` record
- **THEN** the record SHALL include a `method` field set to either `'ldk'` or `'pin'`
- **AND** the store keyPath SHALL be `userId` enforcing at most one local wrapper per user

#### Scenario: At most one local wrapper per user

- **WHEN** the system writes a new local wrapper for a user
- **THEN** any previously stored `local_wrapper` for that user SHALL be overwritten
- **AND** the store SHALL contain exactly one record for that user

## Purpose

Define the browser-side end-to-end encryption master key lifecycle: generation, password-based wrapping, backend persistence, and in-session unwrapping.

## Requirements

### Requirement: Browser generates master key during encryption setup

The system SHALL generate a new random 256-bit master key in the browser when an authenticated user completes first-time encryption setup.

#### Scenario: Setup creates browser-side master key

- **WHEN** an authenticated user submits a valid encryption setup password and acknowledgement
- **THEN** the system SHALL generate the plaintext master key in the browser
- **AND** the system SHALL NOT send the plaintext master key to the backend

### Requirement: Encryption password wraps master key locally

The system SHALL derive a key-encryption key from the encryption password locally and use it to wrap the master key before persistence.

#### Scenario: Setup wraps master key with password-derived key

- **WHEN** the user completes encryption setup
- **THEN** the system SHALL derive a KEK using Argon2id with stored versioned parameters and a random salt
- **AND** the system SHALL encrypt the master key using AES-256-GCM with a random wrap IV
- **AND** the system SHALL bind the wrapped key to stable metadata using AES-GCM AAD

### Requirement: Argon2id derivation runs outside the UI thread

The system SHALL run password-based Argon2id derivation in a dedicated browser Web Worker using `hash-wasm`.

#### Scenario: Setup derives KEK without blocking UI thread

- **WHEN** setup needs to derive the password KEK
- **THEN** the system SHALL send the password, salt, and KDF parameters to the KDF Web Worker
- **AND** the worker SHALL return derived KEK bytes to the main thread

#### Scenario: Unlock derives KEK without blocking UI thread

- **WHEN** unlock needs to derive the password KEK
- **THEN** the system SHALL use the KDF Web Worker for Argon2id derivation
- **AND** AES-GCM unwrap SHALL remain performed with native Web Crypto

### Requirement: Backend stores only encrypted key material

The system SHALL persist encryption key identity and password wrapping metadata without receiving password plaintext, KEK bytes, or plaintext master key bytes.

#### Scenario: Wrapped key is stored for authenticated user

- **WHEN** setup saves the encryption key record
- **THEN** the backend SHALL store an active master key identity for the authenticated user
- **AND** the backend SHALL store an active password wrapping containing the wrapped master key, KDF parameters, KDF salt, wrap parameters, wrap IV, and versions
- **AND** the backend SHALL NOT store the encryption password, KEK, or plaintext master key

### Requirement: Key identity and wrapping records are separate

The system SHALL store master key identity separately from password wrapping records.

#### Scenario: Initial setup creates key and password wrapping

- **WHEN** the first encryption setup succeeds
- **THEN** the system SHALL create one active encryption key record
- **AND** the system SHALL create one active password wrapping record for that key

### Requirement: Unlock unwraps master key locally

The system SHALL unlock encryption by deriving the KEK locally and unwrapping the stored wrapped master key locally.

#### Scenario: Correct password unlocks master key

- **WHEN** an authenticated user provides the correct encryption password
- **AND** an active password wrapping exists locally or from the backend
- **THEN** the system SHALL derive the KEK locally
- **AND** the system SHALL decrypt the wrapped master key locally
- **AND** the system SHALL keep the plaintext master key in memory only

#### Scenario: Incorrect password does not unlock

- **WHEN** an authenticated user provides an incorrect encryption password
- **THEN** AES-GCM unwrap SHALL fail
- **AND** the system SHALL keep encryption locked
- **AND** the system SHALL NOT clear the authenticated session

### Requirement: Backend check gates first-time setup

When no wrapped key record is cached locally, the system SHALL verify with the backend whether an active key exists before allowing the setup flow. This prevents creating a duplicate key when one already exists on the backend but has not been cached yet.

#### Scenario: No local cache triggers backend check

- **WHEN** an authenticated user opens the app
- **AND** no wrapped key record is cached in localStorage for that user
- **THEN** the system SHALL fetch the active key record from the backend before showing setup or unlock UI

#### Scenario: Backend confirms key exists — proceed to unlock

- **WHEN** the backend returns an active key record during the initial check
- **THEN** the system SHALL cache the returned record in localStorage
- **AND** proceed to the unlock screen

#### Scenario: Backend confirms key is absent — proceed to setup

- **WHEN** the backend returns a 404 during the initial check
- **THEN** the system SHALL proceed to the setup screen

#### Scenario: Backend check fails — block until retry succeeds

- **WHEN** the backend check fails with a non-404 error
- **THEN** the system SHALL block navigation to both setup and unlock
- **AND** display a "cannot verify encryption" error with a retry action
- **AND** SHALL NOT allow setup until a successful check has confirmed the key is absent

### Requirement: Cached key record skips backend check

When a valid wrapped key record is already present in localStorage for the current user, the system SHALL skip the backend check and proceed directly to the unlock screen.

#### Scenario: Cached record initializes unlock state directly

- **WHEN** an authenticated user opens the app
- **AND** a valid wrapped key record exists in localStorage for that user
- **THEN** the system SHALL initialize directly in the locked state
- **AND** SHALL NOT perform a backend check on load

### Requirement: Wrapped key cache supports offline unlock

The system SHALL cache the active wrapped key and public parameters locally after successful setup or retrieval so unlock can proceed without fetching the backend record.

#### Scenario: Offline unlock uses cached wrapped key

- **WHEN** the authenticated user has a cached active password wrapping
- **AND** the backend key endpoint is unavailable
- **AND** the user enters the correct encryption password
- **THEN** the system SHALL unwrap the cached wrapped master key locally
- **AND** the system SHALL unlock for the current app session

#### Scenario: Unlock refreshes cache from backend when no local record exists

- **WHEN** the authenticated user initiates unlock
- **AND** no record is cached in localStorage (e.g. cleared manually)
- **THEN** the system SHALL fetch the active key record from the backend
- **AND** cache it before unwrapping

### Requirement: Plaintext master key is session-memory only

The system SHALL keep plaintext master key material only in process memory for the current unlocked app session. The master key is held in React component state and is cleared automatically when the component unmounts.

#### Scenario: Logout clears plaintext key material

- **WHEN** the user logs out or switches authenticated users
- **THEN** the system SHALL clear in-memory plaintext master key material by unmounting the encryption gate component for the previous user
- **AND** a later app session SHALL require the encryption password again

### Requirement: Unlocked master key is available to the sync engine via context

The system SHALL provide the unlocked master key and its key id to the React subtree via an `EncryptionContext`. `EncryptionGate` SHALL be the context provider, exposing `{ masterKey: Uint8Array; keyId: string }` once the session is unlocked. Any component or hook within the subtree MAY consume this context to perform encryption and decryption operations.

#### Scenario: Context is populated after unlock

- **WHEN** the user successfully unlocks encryption (setup or unlock flow)
- **THEN** `EncryptionContext` SHALL provide a non-null `masterKey` and `keyId` to all children of `EncryptionGate`

#### Scenario: Context is not accessible before unlock

- **WHEN** the encryption session is locked or uninitialized
- **THEN** `EncryptionGate` SHALL NOT render its children
- **AND** `EncryptionContext` SHALL NOT be accessible to any sync engine code

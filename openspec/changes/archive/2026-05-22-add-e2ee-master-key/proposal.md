## Why

The encryption setup/unlock UI currently models encryption state locally, but it does not create a real user-held master key or persist a password-wrapped key for later unlock. This change establishes the first backend-backed cryptographic foundation for end-to-end encryption without encrypting application data yet.

## What Changes

- Add server-side storage for user encryption key metadata and password-based key wrappings.
- Add an authenticated backend API for creating and retrieving the current password wrapping.
- During setup, generate a random 256-bit master key in the browser, derive a wrapping key from the encryption password with `hash-wasm` Argon2id in a dedicated Web Worker, wrap the master key with AES-256-GCM, and save only the wrapped key plus public parameters.
- During unlock, load the wrapped key from localStorage cache or backend, derive the wrapping key locally, unwrap the master key locally, and keep the plaintext master key in memory only.
- Cache the wrapped key record in localStorage so an authenticated user can unlock offline after the record has been cached.
- Do not encrypt Yjs/app data in this change.
- Do not add PIN, device-key unlock, recovery, or key rotation in this change.

## Capabilities

### New Capabilities

- `e2ee-master-key`: Browser-side master key generation, password wrapping, backend persistence, local wrapped-key cache, and password unlock semantics.

### Modified Capabilities

- `encryption-unlock-ui`: Setup and unlock screens complete by creating/unwrapping the real password-wrapped master key instead of only updating local placeholder state.

## Impact

- Frontend encryption/session modules under `apps/app/src/e2ee/`.
- Signed-in encryption boundary behavior after setup/unlock.
- New Worker API routes for encryption key setup/retrieval.
- New Drizzle D1 schema and migration for encryption key and wrapping records.
- New `hash-wasm` Argon2id dependency, dedicated KDF Web Worker, and AES-GCM Web Crypto helpers.
- Tests for setup, unlock, local cache fallback, wrong-password handling, auth ownership, and DB persistence.

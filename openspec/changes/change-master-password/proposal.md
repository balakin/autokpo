## Why

Users can set up and unlock encrypted data, but they cannot change the master password that protects the server-side MEK wrapper. A password-change flow lets users rotate the password-derived KEK without rotating local encryption material, the MEK, the DEK, or local unlock wrappers.

## What Changes

- Add a Change master password modal in Settings → Security, available only while encryption is unlocked.
- Require fresh confirmation before changing the password:
  - users with a PIN local wrapper enter the PIN;
  - users without a PIN enter the current master password.
- Allow up to 10 failed verification attempts, then clear the unlocked encryption session.
- Derive a KEK from the new master password and wrap the existing MEK into a new password wrapper.
- Add `POST /api/e2ee/key-ring/change-password` to atomically replace the active server-side password wrapper using `currentWrappingId` compare-and-swap semantics.
- Keep local encryption material and local unlock wrappers unchanged; after success, refetch the key-ring profile and show a success toast.
- On stale/wrong active wrapper conflict, clear the unlocked encryption session and refetch the key-ring profile.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `e2ee-key-ring`: add master password change semantics for replacing only the active server-side password wrapper while preserving the same MEK/key ring.
- `security-settings`: add the Security-tab modal and verification flow for changing the master password.
- `pin-local-wrapper`: specify PIN verification behavior when PIN is used as the password-change confirmation gate.

## Impact

- Worker API: new E2EE change-password endpoint and server-side transaction for revoking the old password wrapper and inserting the new active wrapper.
- Database usage: existing `key_ring_wrapping` lifecycle states and uniqueness constraint are used; no schema change expected.
- Client crypto: helper to create a new password wrapper for an existing MEK using existing KDF/AES-GCM parameters and AAD format.
- Client state/UI: Security settings modal, retry counters, encryption-session clearing on failure/conflict, profile refetch on success.
- Tests: worker contract tests, crypto tests, IndexedDB/cache behavior tests, and Security settings UI flow tests.

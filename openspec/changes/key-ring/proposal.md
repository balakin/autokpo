## Why

The current E2EE model stores a single user encryption key and password wrapping record, which makes the data-encryption key double as the account-level root key. Before release, replace this with a key-ring hierarchy so the app has a clean foundation for future key rotation and wrapper methods without needing production migration.

## What Changes

- **BREAKING** Replace the current `user_encryption_key` / `user_encryption_key_wrapping` model with a per-user `key_ring` and immutable `key_ring_wrapping` records.
- Introduce a KEK → MEK → key ring → DEK hierarchy:
  - password-derived KEK unwraps the MEK
  - MEK decrypts the encrypted key ring
  - active DEK encrypts sync/app data
- Store one `key_ring` per user with clear active DEK metadata, IV, encryption metadata, and encrypted key-ring ciphertext.
- Store password wrappers in `key_ring_wrapping` with frontend-generated ids, method/status fields, wrapping IV, wrapped MEK ciphertext, and DB enforcement of one active wrapper per user+method.
- Replace the E2EE endpoint with `/api/e2ee/key-ring` for creating/fetching the encrypted key ring and active wrappers.
- Keep sync record `encryption_key_id` as a plain DEK id string and reject writes unless it matches the user key ring's active DEK id.
- Cache only the encrypted key-ring response locally; users still type the encryption password each app session.
- Rename internal code/spec terminology from master key to key ring / MEK / DEK while leaving user-facing copy largely unchanged.

## Capabilities

### New Capabilities

- `e2ee-key-ring`: Defines the browser-side key-ring lifecycle, KEK/MEK/DEK hierarchy, encrypted key-ring persistence, password wrappers, local encrypted cache, and unlock behavior.

### Modified Capabilities

- `sync-encryption`: Sync encryption uses the active DEK from the key ring and the server validates uploaded `encryptionKeyId` against the active DEK id.
- `encryption-unlock-ui`: Setup and unlock flows create/fetch/unlock the key ring instead of a single master key record, while preserving the same user-facing session lock behavior.

## Impact

- Worker DB schema and initial migration for E2EE and sync records.
- Worker E2EE route path and request/response contracts.
- Worker sync route validation for `encryptionKeyId`.
- Client E2EE crypto helpers, cache shape, API client, session gate/reducer, and encryption context naming.
- CRDT/sync encryption code that consumes key material and key ids.
- OpenSpec specs and tests that currently reference master keys, user encryption keys, and `/api/e2ee/key`.

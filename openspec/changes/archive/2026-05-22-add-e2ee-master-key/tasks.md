## 1. Dependencies and Data Model

- [x] 1.1 Add `hash-wasm` for Argon2id and confirm it works from a Vite-built browser Web Worker.
- [x] 1.2 Add Drizzle schema tables for `user_encryption_key` and `user_encryption_key_wrapping` with immutable rows and nullable `revoked_at`.
- [x] 1.3 Generate and review the D1 migration for the new encryption key tables.

## 2. Crypto and Local Cache

- [x] 2.1 Implement a dedicated KDF Web Worker that derives Argon2id KEK bytes with `hash-wasm` from password, salt, and versioned params.
- [x] 2.2 Implement browser crypto helpers for random master key/salt/IV generation, worker-backed KEK derivation, AES-GCM wrapping/unwrapping, and deterministic AAD construction.
- [x] 2.3 Implement typed serialization for wrapped key records, including binary/base64 conversion and versioned KDF/wrap parameter validation.
- [x] 2.4 Replace placeholder encryption session material with an in-memory master-key holder that is cleared on logout/user switch.
- [x] 2.5 Add localStorage cache support for encrypted wrapped key records only, with per-user cache keys.

## 3. Backend API

- [x] 3.1 Add authenticated Worker routes to create the initial encryption key and password wrapping for the current user.
- [x] 3.2 Add authenticated Worker routes to retrieve the current active encryption key and password wrapping for the current user.
- [x] 3.3 Validate request payload sizes, algorithms, versions, ownership, and one-active-key/one-active-password-wrapping constraints.

## 4. Frontend Integration

- [x] 4.1 Update setup screen submission to generate and wrap the master key locally, save it to the backend, cache the wrapped record, and unlock in memory.
- [x] 4.2 Update unlock flow to load the cached wrapped key first, fall back to backend retrieval, unwrap locally, and show inline errors on unwrap failure.
- [x] 4.3 Ensure setup/unlock behavior remains scoped to the authenticated user and works across logout and user switching.

## 5. Tests and Verification

- [x] 5.1 Add unit tests for KDF worker integration, crypto helper behavior, AAD mismatch failure, wrong-password failure, and serialization round trips.
- [x] 5.2 Add Worker tests for authenticated create/retrieve, duplicate setup rejection, unauthorized access, and persisted DB shape.
- [x] 5.3 Add UI/integration tests for setup success, unlock success from cache, backend fallback, and incorrect password handling.
- [x] 5.4 Run scoped tests, then run the app test suite with the verbose Vitest reporter.

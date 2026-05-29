## 1. Shared Limits

- [x] 1.1 Create a Worker shared limits module for sync ciphertext, key-ring ciphertext, KDF salt, and wrapped MEK ciphertext byte constants.
- [x] 1.2 Update sync route validation to import and use the shared sync ciphertext limit.
- [x] 1.3 Update E2EE route validation to import and use the shared key-ring and wrapper size limits.

## 2. Request and Field Limits

- [x] 2.1 Add Hono body-limit middleware for `/api/e2ee/*` with the configured E2EE request body budget and HTTP 413 error handling.
- [x] 2.2 Add Hono body-limit middleware for both `/api/sync` and `/api/sync/*` with the configured sync request body budget and HTTP 413 error handling.
- [x] 2.3 Add pre-decode base64 string maximum checks for sync `ciphertext` fields before `Uint8Array.fromBase64`.
- [x] 2.4 Add pre-decode base64 string maximum checks for E2EE key-ring ciphertext, KDF salt, wrapped MEK ciphertext, and IV fields where applicable.

## 3. Database Constraints

- [x] 3.1 Add a size check constraint to `sync_record.ciphertext` using the shared sync ciphertext limit.
- [x] 3.2 Add a size check constraint to `key_ring.ciphertext` using the shared key-ring ciphertext limit.
- [x] 3.3 Add fixed-size check constraints to `key_ring_wrapping.kdf_salt` and `key_ring_wrapping.ciphertext` using the shared wrapper constants.
- [x] 3.4 Generate and review the D1 migration for the new size constraints.
- [x] 3.5 Apply the migration to the local D1 database if required for tests.

## 4. Tests and Verification

- [x] 4.1 Add worker tests proving oversized `/api/e2ee/*` request bodies return HTTP 413 before route-level JSON validation.
- [x] 4.2 Add worker tests proving oversized `/api/sync` and `/api/sync/compact` request bodies return HTTP 413 before route-level JSON validation.
- [x] 4.3 Add tests for oversized base64 fields on sync and E2EE endpoints.
- [x] 4.4 Add database constraint coverage for custom encrypted table size checks where practical.
- [x] 4.5 Run focused worker tests for sync and E2EE routes.
- [x] 4.6 Run package build/typecheck and relevant regression tests.

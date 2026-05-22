## 1. Database Schema

- [x] 1.1 Update `worker/db/schema/updates.ts`: rename file to `sync-record.ts`, rename table to `sync_record`, rename column `idempotency_key` → `id` (NOT NULL, single-column PK), replace composite PK with unique index on `(user_id, seq)`, add `encryption_key_id text NOT NULL` FK → `user_encryption_key.id`
- [x] 1.2 Update `worker/db/schema/index.ts` to export from the renamed schema file
- [x] 1.3 Run `db:generate` to produce a D1 migration for the schema changes
- [x] 1.4 Run `db:migrate:local` to apply the migration to the local D1 instance

## 2. Worker Route — Wire Format

- [x] 2.1 Update `GET /api/sync` in `worker/routes/sync.ts`: return `application/json` with `{ records: [{ seq, kind, encryptionKeyId, encryptionAlgorithm, encryptionVersion, iv, ciphertext }] }` instead of binary stream; read columns and base64-encode `iv` and `ciphertext` in each row
- [x] 2.2 Update `POST /api/sync`: parse JSON body `{ id, encryptionKeyId, encryptionAlgorithm, encryptionVersion, iv, ciphertext }` instead of octet-stream + `Idempotency-Key` header; use `id` for deduplication against `sync_record.id`; store all envelope fields including `encryption_key_id` on insert
- [x] 2.3 Update `POST /api/sync/compact`: same JSON body change as push; store `encryption_key_id` on insert
- [x] 2.4 Remove `Content-Type: application/octet-stream` and `Content-Length` validation from push and compact routes; add JSON body validation with Zod

## 3. Sync Client — Wire Format

- [x] 3.1 Update `pull()` in `src/crdt/sync-client.ts`: parse JSON response `{ records }` instead of binary frame stream; return records with `encryptionKeyId`, `encryptionAlgorithm`, `encryptionVersion`, `iv`, and `ciphertext` fields added to `SyncRecord` type
- [x] 3.2 Update `push()`: send JSON body `{ id, encryptionKeyId, encryptionAlgorithm, encryptionVersion, iv, ciphertext }` with `Content-Type: application/json`; remove `Idempotency-Key` header; accept `encryptionKeyId`, `encryptionAlgorithm`, `encryptionVersion`, and `iv` parameters
- [x] 3.3 Update `compact()`: same JSON body change as push; remove `Idempotency-Key` header; accept `encryptionKeyId`, `encryptionAlgorithm`, `encryptionVersion`, and `iv` parameters
- [x] 3.4 Remove `parseRecordStream()` helper (replaced by JSON.parse)

## 4. Encryption Context

- [x] 4.1 Create `src/e2ee/encryption-context.ts`: define `EncryptionContext` with `{ masterKey: Uint8Array; keyId: string }` and a `useEncryptionContext()` hook that throws if called outside the provider
- [x] 4.2 Update `src/e2ee/encryption-gate.tsx`: provide `EncryptionContext` with `masterKey` and `keyId` (from `gateState.masterKey` and the cached key record's `key.id`) when `session.status === 'unlocked'`
- [x] 4.3 Export `useEncryptionContext` from `src/e2ee/index.ts`

## 5. Encrypt / Decrypt in Sync Engine

- [x] 5.1 Add `encryptSyncPayload(plaintext, masterKey, userId, keyId, kind)` to `src/crdt/sync-logic.ts`: generates random 12-byte IV, calls `aesGcmEncrypt` with AAD `"autokpo:e2ee-update:v1:{userId}:{keyId}:{kind}"`, returns `EncryptedSyncPayload { encryptionAlgorithm: "aes-256-gcm", encryptionVersion: 1, iv, ciphertext }`
- [x] 5.2 Add `decryptSyncPayload(payload, masterKey, userId, keyId, kind)` to `src/crdt/sync-logic.ts`: accepts `EncryptedSyncPayload`, validates algorithm and version, calls `aesGcmDecrypt` with same AAD, returns plaintext bytes
- [x] 5.3 Update `useSyncEngine` in `src/crdt/use-sync-engine.ts`: read `{ masterKey, keyId }` from `useEncryptionContext()`; encrypt delta/snapshot before push/compact calls; decrypt each record ciphertext before `applyRecordsToDoc`
- [x] 5.4 Update `pushMutation` and `compactMutation` in `use-sync-engine.ts` to pass `encryptionKeyId` (= `keyId`) in the request

## 6. Tests

- [x] 6.1 Update sync route tests in `tests/worker/` for the new JSON wire format and `sync_record` table name
- [x] 6.2 Add unit tests for `encryptSyncPayload` and `decryptSyncPayload` in `src/crdt/`
- [x] 6.3 Update `sync-client.ts` tests for JSON request/response format
- [x] 6.4 Add tests for `EncryptionContext` provider: verify context is provided when unlocked, not accessible when locked

## 7. Split envelope: separate JSON fields for IV and encryption_version

- [x] 7.1 Update `src/crdt/sync-logic.ts`: change `encryptSyncPayload` to return `EncryptedSyncPayload { encryptionAlgorithm: "aes-256-gcm"; encryptionVersion: 1; iv: Uint8Array; ciphertext: Uint8Array }` instead of a concatenated `Uint8Array`; update `decryptSyncPayload` to accept `EncryptedSyncPayload` as first argument (removes binary-prefix parsing)
- [x] 7.2 Update `src/crdt/sync-client.ts`: add `encryptionVersion` and `iv` to `SyncRecord` type; update `push()` and `compact()` to accept and send `encryptionVersion`/`iv` as separate JSON fields; update `pull()` to decode `iv` from base64 and populate `SyncRecord.iv`
- [x] 7.3 Update `src/crdt/use-sync-engine.ts`: destructure `{ encryptionVersion, encryptionAlgorithm, iv, ciphertext }` from `encryptSyncPayload` result; pass them through to `pushMutation`/`compactMutation`; pass `{ encryptionAlgorithm, encryptionVersion, iv, ciphertext: record.ciphertext }` to `decryptSyncPayload` on pull
- [x] 7.4 Update `worker/routes/sync.ts`: add `encryptionVersion` (literal 1) and `iv` to Zod envelope schema; validate decoded IV is exactly 12 bytes; store `encryptionVersion`/`iv` in DB; include them in GET response records; reduce max blob size to `MAX_PLAINTEXT_BYTES + 16` (GCM tag only, IV is now a separate column)
- [x] 7.5 Update `worker/db/schema/sync-record.ts`: add `encryption_version INTEGER NOT NULL` and `iv BLOB NOT NULL` columns; rename `blob` column to `ciphertext`
- [x] 7.6 Generate and apply D1 migration for the new schema columns (`db:generate`, `db:migrate:local`)
- [x] 7.7 Update all tests: `sync-logic.spec.ts` for new encrypt/decrypt API; `sync-client.spec.ts` for `encryptionVersion`/`iv` fields; `sync.spec.ts` for new push/compact body and GET response; `main.spec.ts` and `avatars.spec.ts` for `sync_record` table name

## 8. Encryption algorithm metadata

- [x] 8.1 Add `encryptionAlgorithm: "aes-256-gcm"` to encrypted sync payloads, sync client types, push/compact JSON bodies, and pull response records
- [x] 8.2 Add `encryption_algorithm TEXT NOT NULL` to `sync_record` schema and migration metadata
- [x] 8.3 Validate `encryptionAlgorithm` in worker request schemas and reject unsupported algorithms during decrypt
- [x] 8.4 Update sync route/client/logic tests and OpenSpec docs for per-record algorithm metadata

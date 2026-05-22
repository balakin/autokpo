## 1. Database Schema

- [ ] 1.1 Update `worker/db/schema/updates.ts`: rename file to `sync-record.ts`, rename table to `sync_record`, rename column `idempotency_key` → `id` (NOT NULL, single-column PK), replace composite PK with unique index on `(user_id, seq)`, add `encryption_key_id text NOT NULL` FK → `user_encryption_key.key_id`
- [ ] 1.2 Update `worker/db/schema/index.ts` to export from the renamed schema file
- [ ] 1.3 Run `db:generate` to produce a D1 migration for the schema changes
- [ ] 1.4 Run `db:migrate:local` to apply the migration to the local D1 instance

## 2. Worker Route — Wire Format

- [ ] 2.1 Update `GET /api/sync` in `worker/routes/sync.ts`: return `application/json` with `{ records: [{ seq, kind, encryptionKeyId, blob: base64 }] }` instead of binary stream; read `blob` column and base64-encode each row
- [ ] 2.2 Update `POST /api/sync`: parse JSON body `{ id, encryptionKeyId, blob }` instead of octet-stream + `Idempotency-Key` header; use `id` for deduplication against `sync_record.id`; store `encryption_key_id` on insert
- [ ] 2.3 Update `POST /api/sync/compact`: same JSON body change as push; store `encryption_key_id` on insert
- [ ] 2.4 Remove `Content-Type: application/octet-stream` and `Content-Length` validation from push and compact routes; add JSON body validation with Zod

## 3. Sync Client — Wire Format

- [ ] 3.1 Update `pull()` in `src/crdt/sync-client.ts`: parse JSON response `{ records }` instead of binary frame stream; return records with `encryptionKeyId` field added to `SyncRecord` type
- [ ] 3.2 Update `push()`: send JSON body `{ id, encryptionKeyId, blob: base64 }` with `Content-Type: application/json`; remove `Idempotency-Key` header; accept `encryptionKeyId` parameter
- [ ] 3.3 Update `compact()`: same JSON body change as push; remove `Idempotency-Key` header; accept `encryptionKeyId` parameter
- [ ] 3.4 Remove `parseRecordStream()` helper (replaced by JSON.parse)

## 4. Encryption Context

- [ ] 4.1 Create `src/e2ee/encryption-context.ts`: define `EncryptionContext` with `{ masterKey: Uint8Array; keyId: string }` and a `useEncryptionContext()` hook that throws if called outside the provider
- [ ] 4.2 Update `src/e2ee/encryption-gate.tsx`: provide `EncryptionContext` with `masterKey` and `keyId` (from `gateState.masterKey` and the cached key record's `key.id`) when `session.status === 'unlocked'`
- [ ] 4.3 Export `useEncryptionContext` from `src/e2ee/index.ts`

## 5. Encrypt / Decrypt in Sync Engine

- [ ] 5.1 Add `encryptSyncBlob(plaintext, masterKey, userId, keyId, kind)` to `src/crdt/sync-logic.ts`: generates random 12-byte IV, calls `aesGcmEncrypt` with AAD `"autokpo:e2ee-update:v1:{userId}:{keyId}:{kind}"`, returns `[enc_version: 1][iv: 12 bytes][ciphertext…]`
- [ ] 5.2 Add `decryptSyncBlob(blob, masterKey, userId, keyId, kind)` to `src/crdt/sync-logic.ts`: reads first byte as enc_version, next 12 as IV, rest as ciphertext, calls `aesGcmDecrypt` with same AAD, returns plaintext bytes
- [ ] 5.3 Update `useSyncEngine` in `src/crdt/use-sync-engine.ts`: read `{ masterKey, keyId }` from `useEncryptionContext()`; encrypt delta/snapshot before push/compact calls; decrypt each record blob before `applyRecordsToDoc`
- [ ] 5.4 Update `pushMutation` and `compactMutation` in `use-sync-engine.ts` to pass `encryptionKeyId` (= `keyId`) in the request

## 6. Tests

- [ ] 6.1 Update sync route tests in `tests/worker/` for the new JSON wire format and `sync_record` table name
- [ ] 6.2 Add unit tests for `encryptSyncBlob` and `decryptSyncBlob` in `src/crdt/`
- [ ] 6.3 Update `sync-client.ts` tests for JSON request/response format
- [ ] 6.4 Add tests for `EncryptionContext` provider: verify context is provided when unlocked, not accessible when locked

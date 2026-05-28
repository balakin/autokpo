## 1. Shared params type and primitives

- [ ] 1.1 Add `aesGcmParamsV1Schema` and `AesGcmParamsV1` type to `key-ring-record.ts`; export `AES_GCM_PARAMS_V1 = { tagBits: 128 }` constant
- [ ] 1.2 Update `aesGcmEncrypt` and `aesGcmDecrypt` in `aes-gcm.ts` to accept `params: { iv: Uint8Array, tagBits: number }` instead of bare `iv` and hardcoded `tagLength: 128`

## 2. Key ring and wrapper schemas (`key-ring-record.ts`)

- [ ] 2.1 Remove `encryptionVersion` and `wrappingVersion` and `kdfVersion` fields from all schemas
- [ ] 2.2 Update `keyRingSchema`: replace top-level `iv` with `encryptionParams: aesGcmParamsV1Schema`
- [ ] 2.3 Update `wrapperSchema`: replace `wrappingParams: wrappingParamsV1Schema` + `wrappingIv` with `wrappingParams: aesGcmParamsV1Schema` (iv inside)
- [ ] 2.4 Update `createKeyRingProfileRequestSchema` to match new shapes (remove version fields, iv inside params)
- [ ] 2.5 Update `changeMasterPasswordRequestSchema` to match new shapes
- [ ] 2.6 Update `updateKeyRingRequestSchema` to match new shapes
- [ ] 2.7 Remove `WrappingParamsV1` / `wrappingParamsV1Schema` and `WRAPPING_PARAMS_V1`; update all references to use `AesGcmParamsV1`

## 3. Key ring IDB schemas and migration (`keys-indexeddb.ts`)

- [ ] 3.1 Update `keyRingRecordSchema`: remove `encryptionVersion`, replace `iv` with `encryptionParams: aesGcmParamsV1Schema`
- [ ] 3.2 Update `wrapperRecordSchema`: remove `wrappingVersion`/`kdfVersion`, replace `wrappingIv` with `wrappingParams: aesGcmParamsV1Schema`
- [ ] 3.3 Update `localWrapperRecordLdkSchema`: replace standalone `wrappingIv` with `wrappingParams: aesGcmParamsV1Schema`
- [ ] 3.4 Update `localWrapperRecordPinSchema`: remove `pinEncryptionVersion`/`wrappingVersion`/`kdfVersion`, replace `pinSaltIv` with `pinEncryptionParams: aesGcmParamsV1Schema`, replace `wrappingIv` with `wrappingParams: aesGcmParamsV1Schema`
- [ ] 3.5 Bump `DB_VERSION` and write `onupgradeneeded` migration that reads old records and rewrites them to new shape

## 4. Encryption crypto (`encryption-crypto.ts`)

- [ ] 4.1 Update `createKeyRingProfilePayload`: build `encryptionParams`/`wrappingParams` objects with iv inside; remove version fields from request
- [ ] 4.2 Update `createPasswordWrapperPayload`: same params restructure
- [ ] 4.3 Update `unwrapKeyRingProfile`: read `wrapper.wrappingParams.iv` instead of `wrapper.wrappingIv`
- [ ] 4.4 Update `decryptKeyRingWithMek`: read `keyRing.encryptionParams.iv` instead of `keyRing.iv`
- [ ] 4.5 Update `createRotatedKeyRingPayload`: build `encryptionParams` with iv inside; remove version fields
- [ ] 4.6 Update `wrapMekWithLdk` / `unwrapMekWithLdk`: return/accept `wrappingParams: { iv, tagBits }` instead of standalone `iv`; pass `tagBits` to `aesGcmEncrypt`/`aesGcmDecrypt`
- [ ] 4.7 Update `wrapMekWithPin` / `unwrapMekWithPin`: return/accept `pinEncryptionParams` and `wrappingParams` with iv inside

## 5. Sync wire format (`sync-logic.ts`, `sync-client.ts`, `use-sync-engine.ts`)

- [ ] 5.1 Update `EncryptedSyncPayload` interface: replace `encryptionVersion` + bare `iv` with `encryptionParams: { iv: Uint8Array, tagBits: number }`
- [ ] 5.2 Update `encryptSyncPayload`: build and return `encryptionParams` object; remove `encryptionVersion`
- [ ] 5.3 Update `decryptSyncPayload`: read `payload.encryptionParams.iv` and `tagBits`; remove version check
- [ ] 5.4 Update `SyncRecord` in `sync-client.ts`: replace `encryptionVersion` + bare `iv` with `encryptionParams`
- [ ] 5.5 Update `pull` response parsing: map `encryptionParams` from wire JSON
- [ ] 5.6 Update `push` and `compact` request bodies: serialize `encryptionParams` to JSON; remove `encryptionVersion` and standalone `iv`
- [ ] 5.7 Update all `use-sync-engine.ts` callsites that destructure or pass `encryptionVersion`/`encryptionAlgorithm`/`iv` separately

## 6. CRDT local persistence (`encrypted-indexeddb-persistence.ts`)

- [ ] 6.1 Update `EncryptedIndexeddbEnvelope`: replace `encryptionVersion` + `iv` with `encryptionParams: { iv: Uint8Array, tagBits: number }`
- [ ] 6.2 Update `LocalKeyRecord`: replace `wrappingVersion` + `wrappingIv` with `wrappingParams: { iv: Uint8Array, tagBits: number }`
- [ ] 6.3 Update envelope write path: build `encryptionParams` with random iv; remove `encryptionVersion`
- [ ] 6.4 Update local key write path: build `wrappingParams` with iv; remove `wrappingVersion`
- [ ] 6.5 Update envelope read/parse path: read `encryptionParams.iv` and `tagBits`
- [ ] 6.6 Update local key read path: read `wrappingParams.iv` and `tagBits`
- [ ] 6.7 Bump CRDT IDB `DB_VERSION` and write migration for existing envelopes and local key records

## 7. Server worker schemas

- [ ] 7.1 Locate server-side sync record validation schemas in the worker
- [ ] 7.2 Update push and compact request validation: accept `encryptionParams` object; remove `encryptionVersion` and standalone `iv`
- [ ] 7.3 Update pull response serialization: emit `encryptionParams` instead of `encryptionVersion` + `iv`

## 8. Tests

- [ ] 8.1 Update unit tests for `aes-gcm.ts` to pass params object
- [ ] 8.2 Update `encryption-crypto` tests: use new record shapes
- [ ] 8.3 Update `keys-indexeddb` tests: use new IDB record shapes
- [ ] 8.4 Update `sync-logic` and `sync-client` tests: use new payload shapes
- [ ] 8.5 Update `encrypted-indexeddb-persistence` tests: use new envelope shapes
- [ ] 8.6 Update `key-ring-api` and related integration tests

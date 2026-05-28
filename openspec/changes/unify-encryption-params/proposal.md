## Why

Encryption parameters (`iv`, `tagBits`) are scattered inconsistently across all encrypted data models — sometimes as bare sibling fields, sometimes partially grouped with generation hints (`ivBytes`), and never fully self-describing. Unifying them into a single `encryptionParams` / `wrappingParams` object per encrypted blob makes every record self-describing, removes magic numbers from call sites, and establishes a consistent pattern across the entire E2EE layer.

## What Changes

- **BREAKING** Remove all `*Version` fields (`encryptionVersion`, `wrappingVersion`, `kdfVersion`) — the algorithm name already encodes this identity
- **BREAKING** Move `iv` (actual bytes) inside the params object: `encryptionParams: { iv, tagBits }` and `wrappingParams: { iv, tagBits }`
- **BREAKING** Remove standalone `*Iv` fields (`iv`, `wrappingIv`, `keyRingIv`, `pinSaltIv`) — now live inside params
- **BREAKING** Remove `ivBytes` from params — generation hint is no longer stored; IV length is implied by the stored value
- `aes-gcm.ts`: accept `tagBits` as a parameter instead of hardcoding `128`
- All Zod schemas updated: `keyRingSchema`, `wrapperSchema`, `updateKeyRingRequestSchema`, `createKeyRingProfileRequestSchema`, `changeMasterPasswordRequestSchema`, `KeyRingRecord`, `WrapperRecord`, `LocalWrapperRecordLdk`, `LocalWrapperRecordPin`, `EncryptedIndexeddbEnvelope`, `LocalKeyRecord`, `SyncRecord`, `EncryptedSyncPayload`
- Introduce shared `aesGcmParamsV1Schema` and `AES_GCM_PARAMS_V1` constant used everywhere
- IDB schema migrations required for `autokpo-e2ee` and CRDT persistence stores

## Capabilities

### New Capabilities

- `e2ee-aes-gcm-params`: Shared AES-GCM params type `{ iv, tagBits }` used as the single params shape for all AES-GCM encryption and wrapping operations

### Modified Capabilities

- `e2ee-key-ring`: Key ring record and wrapper schema shapes change (version fields removed, iv moves into params)
- `sync-encryption`: Sync record wire format changes (version field removed, iv moves into encryptionParams)
- `local-persistence-encryption`: IDB envelope and local key record shapes change
- `local-device-key`: LDK wrapping record shape changes (wrappingIv moves into wrappingParams)
- `pin-local-wrapper`: PIN wrapper record shape changes (pinSaltIv, wrappingIv move into params)

## Impact

- **Server API**: Sync push/compact endpoints receive records without `encryptionVersion`; `iv` moves into `encryptionParams` — server must accept new shape
- **IndexedDB**: Two IDB databases need version bumps and migration logic (`autokpo-e2ee` key ring/wrapper stores, CRDT persistence store)
- **Existing encrypted data**: All stored records use old shape — migration reads old format, writes new format on first open
- **Files**: `e2ee/key-ring-record.ts`, `e2ee/keys-indexeddb.ts`, `e2ee/encryption-crypto.ts`, `e2ee/aes-gcm.ts`, `crdt/sync-logic.ts`, `crdt/sync-client.ts`, `crdt/encrypted-indexeddb-persistence.ts`, `crdt/use-sync-engine.ts`

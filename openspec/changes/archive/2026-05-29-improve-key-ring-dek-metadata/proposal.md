## Why

The encrypted key ring plaintext duplicates `version`, `revision`, and `activeDekId` — fields already present on the outer backend record and cryptographically bound by AES-GCM AAD — creating noise without security benefit. DEKs also carry no lifecycle metadata, making it impossible to know when each key was generated or retired without external record-keeping.

## What Changes

- **BREAKING**: Remove `version`, `revision`, and `activeDekId` from the key ring plaintext. `revision` and `activeDekId` are authenticated by AAD; `version` is replaced by `plaintextSchemaVersion` on the outer backend record (so the decoder knows how to interpret the bytes before parsing them — important if the serialization format ever changes).
- **BREAKING**: Change each `deks` entry in the plaintext from a bare base64 string to an object `{ key, createdAt, retiredAt }` where `createdAt` and `retiredAt` are millisecond Unix timestamps (`number`).
- On key ring creation the single initial DEK gets `createdAt = Date.now()` and `retiredAt = null`.
- On rotation the outgoing active DEK is stamped `retiredAt = Date.now()` and the new DEK gets `createdAt = Date.now()`, `retiredAt = null`.
- In-memory `DecryptedKeyRing.deks` type changes from `Record<string, Uint8Array>` to `Record<string, DekEntry>` where `DekEntry = { key: Uint8Array; createdAt: number; retiredAt: number | null }`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `e2ee-key-ring`: plaintext structure changes — remove `version`/`revision`/`activeDekId` from plaintext; add `plaintextSchemaVersion` to outer record; add per-DEK `createdAt`/`retiredAt` timestamps; the requirement "Key ring plaintext carries revision" is removed and replaced by the simpler post-decryption check that `activeDekId in deks` (using `activeDekId` from the outer record).

## Impact

- `apps/app/src/e2ee/encryption-crypto.ts` — plaintext encode/decode, `DecryptedKeyRing.deks` type, `createKeyRingProfilePayload`, `createRotatedKeyRingPayload`
- `apps/app/src/e2ee/encryption-gate-reducer.ts` — `deks` field type
- `apps/app/src/e2ee/encryption-context.ts` — `deks` field type
- `apps/app/src/e2ee/encryption-gate.tsx` — `getDek` extracts `.key`
- `apps/app/src/crdt/use-sync-engine.ts` — DEK byte access via `.key`
- All related test files
- `apps/app/src/e2ee/key-ring-record.ts` — add `plaintextSchemaVersion` to `keyRingSchema` and `updateKeyRingRequestSchema`; add to `createKeyRingProfileRequestSchema` key ring sub-object
- Worker key ring schemas — add `plaintextSchemaVersion` field
- No IDB migration needed (app not yet released)

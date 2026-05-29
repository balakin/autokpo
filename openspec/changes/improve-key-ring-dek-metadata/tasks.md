## 1. Schema changes (outer record)

- [ ] 1.1 Add `plaintextSchemaVersion: z.literal(1)` to `keyRingSchema` in `key-ring-record.ts`
- [ ] 1.2 Add `plaintextSchemaVersion: z.literal(1)` to the key ring sub-object in `createKeyRingProfileRequestSchema`
- [ ] 1.3 Add `plaintextSchemaVersion: z.literal(1)` to `updateKeyRingRequestSchema`
- [ ] 1.4 Add `plaintextSchemaVersion` to the worker key ring Zod schemas (server-side)

## 2. Core types and plaintext encoding

- [ ] 2.1 Export `DekEntry` type from `encryption-crypto.ts`: `{ key: Uint8Array; createdAt: number; retiredAt: number | null }`
- [ ] 2.2 Change `DecryptedKeyRing.deks` from `Record<string, Uint8Array>` to `Record<string, DekEntry>`
- [ ] 2.3 Update `createKeyRingProfilePayload`: plaintext is `{ deks: { [id]: { key: bytesToBase64(dek), createdAt: Date.now(), retiredAt: null } } }`; remove `version`, `revision`, `activeDekId`; pass `plaintextSchemaVersion: 1` in the request object
- [ ] 2.4 Update `createRotatedKeyRingPayload`: plaintext is `{ deks: ... }`; stamp outgoing `activeDekId` with `retiredAt = Date.now()`; new DEK entry uses `{ key: ..., createdAt: Date.now(), retiredAt: null }`; update `deks` parameter type to `Record<string, DekEntry>`; pass `plaintextSchemaVersion: 1` in the request object
- [ ] 2.5 Update `decryptKeyRingWithMek`: parse new plaintext shape (only `deks`); decode each entry from `{ key, createdAt, retiredAt }`; replace plaintext `revision`/`activeDekId` validation with `keyRing.activeDekId in deks` check using outer record

## 3. Context and state propagation

- [ ] 3.1 Update `EncryptionGateState.deks` and the `unlocked` action in `encryption-gate-reducer.ts` to use `Record<string, DekEntry> | null`
- [ ] 3.2 Update `EncryptionContextValue.deks` in `encryption-context.ts` to `Record<string, DekEntry>`
- [ ] 3.3 Update `getDek` implementation in `encryption-gate.tsx` to return `gateState.deks?.[dekId]?.key ?? null`

## 4. Sync engine

- [ ] 4.1 Update `use-sync-engine.ts`: change `deks` parameter type to `Record<string, DekEntry>`; update DEK byte access from `deks[encryptionKeyId]` to `deks[encryptionKeyId]?.key`

## 5. Tests

- [ ] 5.1 Update `encryption-crypto.spec.ts`: fix plaintext shape in all test fixtures; add assertions for `createdAt`/`retiredAt` on DEK entries; verify rotation stamps `retiredAt` on outgoing DEK
- [ ] 5.2 Update `key-ring-api.spec.ts` and `keys-indexeddb.spec.ts`: fix any fixtures referencing old plaintext shape or `deks` as bare bytes
- [ ] 5.3 Update `encryption-gate-reducer.spec.ts`: fix `deks` field in `unlocked` action fixtures
- [ ] 5.4 Run full test suite and fix any remaining type or runtime failures

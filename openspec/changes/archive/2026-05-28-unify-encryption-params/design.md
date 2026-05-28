## Context

The E2EE layer has three categories of encrypted blobs — key ring blobs (encrypted with MEK), wrapped MEK records (encrypted with KEK or LDK), and sync/CRDT payloads (encrypted with DEK) — and each carries encryption metadata inconsistently. Some have `*Version` + `*Algorithm` + bare `iv` as siblings; some have a partial params object with `ivBytes` (a generation hint) rather than the actual IV value; some have no params object at all. The `aes-gcm.ts` primitives hardcode `tagLength: 128`.

The result: adding a second algorithm or changing tag length requires touching every callsite independently. New encrypted blob types copy an inconsistent model.

## Goals / Non-Goals

**Goals:**

- Single shared params type `{ iv: string, tagBits: number }` for all AES-GCM operations
- `iv` lives inside params, not as a sibling field
- `*Version` fields removed everywhere; the algorithm string is the version
- `tagBits` flows through to `aes-gcm.ts` instead of being hardcoded
- All existing Zod schemas and TypeScript types updated consistently
- IDB migrations for both `autokpo-e2ee` and CRDT persistence stores

**Non-Goals:**

- Adding support for any algorithm other than AES-GCM (no polymorphism needed now)
- Changing the server-side DB schema (server stores what the client sends; client change is sufficient)
- Rotating or re-encrypting existing user data at the server level

## Decisions

### D1: Shared `aesGcmParamsV1Schema` in `key-ring-record.ts`

Define one Zod schema and one TypeScript type used everywhere:

```ts
export const aesGcmParamsV1Schema = z.object({
  iv: z.string(), // base64, 12 bytes
  tagBits: z.number().int(),
});
export type AesGcmParamsV1 = z.infer<typeof aesGcmParamsV1Schema>;

export const AES_GCM_PARAMS_V1 = { tagBits: 128 } as const;
// iv is per-encryption; only tagBits is a reusable constant
```

For in-memory / binary contexts (IDB persistence, sync payloads before serialization) use `Uint8Array` for `iv` — the schema handles base64↔bytes at the boundary.

**Alternative considered**: separate `EncryptionParamsV1` and `WrappingParamsV1` types. Rejected — identical shape, no semantic benefit from splitting.

### D2: Remove all `*Version` fields

`encryptionVersion`, `wrappingVersion`, `kdfVersion` are all removed. The algorithm literal (`'aes-256-gcm'`, `'argon2id'`) already uniquely identifies the expected params shape. Any future structural change would use a new algorithm string (e.g., `'aes-256-gcm-v2'`).

**Alternative considered**: embed version in algorithm string as `'aes-256-gcm@1'`. Rejected — the `@version` suffix buys nothing today since we never do multi-version dispatch; plain algorithm name is simpler.

### D3: `ivBytes` removed from params

`ivBytes` was a generation hint (how many random bytes to allocate for the IV). With `iv` stored as the actual value, the length is implicit. IV generation uses `randomBytes(12)` directly at callsites, or a local constant — it does not need to be stored.

### D4: `aesGcmEncrypt` / `aesGcmDecrypt` accept `tagBits`

```ts
aesGcmEncrypt({ keyBytes, params: AesGcmParamsV1, plaintext, aad });
aesGcmDecrypt({ keyBytes, params: AesGcmParamsV1, ciphertext, aad });
```

The `iv` and `tagBits` come from the params object passed in. Hardcoded `128` removed. This makes the primitives fully parameterized without coupling them to the schema type.

### D5: IDB migration strategy — read-old, write-new on open

For both `autokpo-e2ee` (DB version 1→2) and the CRDT persistence store:

- Bump `DB_VERSION`
- In `onupgradeneeded`: iterate existing records, transform to new shape, re-put
- Old shape detection: presence of top-level `iv` / `encryptionVersion` field
- No data loss: transformation is purely structural (no re-encryption needed — the actual bytes are unchanged, just moved into the params object)

### D6: Wire format change is client-driven

The sync API endpoints receive what the client sends. Removing `encryptionVersion` from the push/compact body and nesting `iv` inside `encryptionParams` is a breaking change to the wire format. The server worker schema must be updated in the same change.

## Risks / Trade-offs

- **IDB migration failure** → client loses local state, falls back to server pull on next sync. Acceptable; CRDT state is always recoverable from the server.
- **Partial deploy (old client + new server or vice versa)** → wire format mismatch. Mitigation: deploy server worker and client atomically (Cloudflare Pages + Worker deploy together).
- **Tests using old record shapes** → will fail at compile time (TypeScript) or at parse time (Zod). This is a feature — all affected tests are forced to update.

## Migration Plan

1. Update `key-ring-record.ts` — new schema, remove `*Version` fields, `iv` inside params
2. Update `keys-indexeddb.ts` — new record schemas + DB version bump with migration
3. Update `aes-gcm.ts` — accept `tagBits` param
4. Update `encryption-crypto.ts` — use new params shape throughout
5. Update `crdt/encrypted-indexeddb-persistence.ts` — new envelope/key record shape + DB migration
6. Update `crdt/sync-logic.ts` + `sync-client.ts` + `use-sync-engine.ts` — new wire format
7. Update server worker schemas to match new wire format
8. Update all tests

Rollback: revert all files atomically. IDB migration is one-way (old clients won't read migrated IDB), so rollback requires clearing IDB — acceptable in dev, documented for production.

## Open Questions

- Does the server worker have its own Zod/validation schemas for the sync record shape? Need to confirm and update them in the same PR.

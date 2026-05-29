## Context

The key ring plaintext currently has the shape:

```json
{
  "version": 1,
  "revision": 3,
  "activeDekId": "uuid-B",
  "deks": { "uuid-A": "base64", "uuid-B": "base64" }
}
```

`revision` and `activeDekId` are present on the outer serialized key ring record and are already cryptographically bound by the AES-GCM AAD string `autokpo:e2ee-key-ring:v1:{keyRingId}:{userId}:{activeDekId}:{revision}`. After a successful decryption these values are authenticated — duplicating them inside the plaintext adds bytes with no security benefit. The old `version: 1` field is moved to the outer backend record as `plaintextSchemaVersion`. Keeping it outside the ciphertext means the decoder knows how to interpret the decrypted bytes _before_ parsing them — critical if the serialization format ever changes from JSON to a binary format (MessagePack, CBOR, etc.), since you can't parse the bytes to find the version if you don't know the format first.

DEKs in the plaintext are bare base64 strings with no lifecycle metadata, making it impossible to know when each key was created or when it was superseded.

No migration is needed — the app is not yet released.

## Goals / Non-Goals

**Goals:**

- Remove `version`, `revision`, and `activeDekId` from the key ring plaintext
- Add `plaintextSchemaVersion: 1` to the outer backend record (`keyRingSchema`, `updateKeyRingRequestSchema`, worker schemas)
- Change each `deks` entry from a bare base64 string to `{ key, createdAt, retiredAt }` where timestamps are millisecond Unix numbers
- Keep the post-decryption consistency check (`activeDekId in deks`) using the outer record's `activeDekId`
- Stamp `retiredAt` on the outgoing active DEK during rotation
- Propagate `DekEntry` type through all in-memory consumers

**Non-Goals:**

- Removing `activeDekId` or `revision` from the outer backend record or AAD (they stay there)
- Adding a display UI for DEK metadata in this change
- Any IDB or backend schema migration

## Decisions

### D1: Plaintext carries only `deks`; `plaintextSchemaVersion` lives on the outer record

After removing all three redundant fields, the plaintext is:

```json
{
  "deks": {
    "<id>": { "key": "<base64>", "createdAt": 1737000000000, "retiredAt": null }
  }
}
```

`plaintextSchemaVersion` is added to the outer backend record alongside `encryptionAlgorithm`:

```
keyRing.plaintextSchemaVersion: 1
```

Placing the version outside the ciphertext means the decoder can branch on format before attempting to parse the decrypted bytes — essential if the serialization ever changes from JSON to a binary format, since you can't read a version field you don't know how to parse yet.

The post-decryption check becomes: `keyRing.activeDekId in deks` (using outer record). If that check fails decryption still throws `EncryptionUnlockError`.

**Alternative considered**: keep `plaintextSchemaVersion` inside the plaintext. Rejected — defeats the purpose: if the format changes, you need the version before parsing, not inside the thing you're trying to parse.

**Alternative considered**: keep `activeDekId` in plaintext as an extra consistency assertion. Rejected — it's redundant with the AAD. If the AAD passes, the outer `activeDekId` is authenticated.

### D2: Timestamps are millisecond Unix numbers

`Date.now()` produces a 13-digit integer. Compared to a 24-character ISO-8601 string this saves ~11 bytes per DEK entry and is simpler to compare (`retiredAt > createdAt`).

### D3: `DekEntry` type exported from `encryption-crypto.ts`

`DekEntry = { key: Uint8Array; createdAt: number; retiredAt: number | null }` is defined and exported from `encryption-crypto.ts`. `DecryptedKeyRing.deks` becomes `Record<string, DekEntry>`. Callers that only need raw bytes use `entry.key`; callers that need metadata access the full entry.

**Alternative considered**: separate `deks: Record<string, Uint8Array>` and `dekMeta: Record<string, DekMeta>`. Rejected — two maps for the same keyed entity is awkward; single map with richer values is cleaner.

### D4: `getDek` in `EncryptionContext` keeps returning `Uint8Array | null`

`getDek` is a convenience method for callers that only need raw bytes. Its implementation extracts `.key` from the `DekEntry`. The full `deks` map remains available on the context for callers that want metadata.

### D5: `createRotatedKeyRingPayload` stamps `retiredAt` before building `nextDeks`

```ts
const now = Date.now();
const retiredDeks = Object.fromEntries(
  Object.entries(deks).map(([id, entry]) => [
    id,
    id === activeDekId ? { ...entry, retiredAt: now } : entry,
  ]),
);
const newDekEntry: DekEntry = {
  key: activeDek,
  createdAt: now,
  retiredAt: null,
};
const nextDeks = { ...retiredDeks, [activeDekId]: newDekEntry };
```

Only the current `activeDekId` is stamped; already-retired DEKs retain their original `retiredAt`.

## Risks / Trade-offs

- **Existing test fixtures use old plaintext shape** → TypeScript compile errors will surface every callsite; failing tests are expected and serve as the migration checklist.
- **`retiredAt` set by the client clock** → subject to clock skew between tabs or devices, but this is informational metadata only, not used for access control.
- **Plaintext grows slightly per DEK** → each entry adds `createdAt` + `retiredAt` fields (~30 bytes per DEK). Acceptable; key ring ciphertext limit already guards unbounded growth.

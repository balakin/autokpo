## Context

Yjs sync blobs are currently stored and transmitted as plaintext binary. The Cloudflare Worker and D1 database can read every document update and snapshot. The E2EE master key infrastructure (key generation, password wrapping, backend storage, session unlock) is already in place — the sync layer simply never used it.

The sync wire format is a hand-rolled binary frame stream (`[seq: u32][kind: u8][len: u32][blob…]`). Adding per-record metadata fields (iv, encryption key id) to a binary frame requires manual offset arithmetic and makes future versioning painful.

## Goals / Non-Goals

**Goals:**

- Server stores and forwards opaque ciphertext it cannot read
- Sync blobs encrypted with the session master key before leaving the browser
- Received blobs decrypted before being applied to the Y.Doc
- Wire format is easy to evolve and debug
- Schema reflects the encryption relationship between rows and keys

**Non-Goals:**

- Key rotation (only one active key per user is supported)
- Re-encrypting existing plaintext rows (app is not yet deployed)
- Encrypting sync metadata (cursor, ETag, headers)
- End-to-end encryption of any data outside the sync blob

## Decisions

### 1. Split envelope: JSON fields for algorithm, IV, and encryption_version, base64 ciphertext for blob

All envelope metadata (`encryption_algorithm`, `encryption_version`, `iv`) is sent as top-level JSON fields. The `blob` field in the wire format and the `blob` DB column contain **ciphertext only** (no length prefix, no embedded IV):

Push/compact request body:

```json
{
  "id": "…",
  "encryptionKeyId": "…",
  "encryptionAlgorithm": "aes-256-gcm",
  "encryptionVersion": 1,
  "iv": "<base64 12 bytes>",
  "blob": "<base64 ciphertext>"
}
```

Pull response per record:

```json
{
  "seq": 1,
  "kind": "update",
  "encryptionKeyId": "…",
  "encryptionAlgorithm": "aes-256-gcm",
  "encryptionVersion": 1,
  "iv": "<base64 12 bytes>",
  "blob": "<base64 ciphertext>"
}
```

The DB schema mirrors the wire format: `sync_record` has separate `encryption_algorithm TEXT NOT NULL`, `encryption_version INTEGER NOT NULL`, and `iv BLOB NOT NULL` columns alongside `blob`.

**Why:** Envelope metadata (algorithm, version, IV) is now inspectable without decoding the binary blob. Server can validate `encryptionAlgorithm` and `encryptionVersion` via Zod and enforce `iv.byteLength === 12` without any binary parsing. All DB columns are typed and queryable. The `blob` column stores only opaque ciphertext — consistent with the server's role as a storage relay that cannot read it.

**Alternative considered:** Self-contained binary blob `[encryption_version: u8][iv: 12 bytes][ciphertext…]` stored and transmitted as a single base64 field. Considered initially; discarded because it forces the server to do manual byte-offset parsing to validate IV length, couples the DB schema to a client-defined binary layout, and makes envelope fields opaque to server-side queries and debugging.

### 2. JSON wire format (replacing binary octet-stream)

Push and compact request bodies become `application/json`. Pull responses become a JSON object `{ records: [...] }`. Blob bytes are base64-encoded.

**Why:** The binary frame parser must be updated anyway to carry new metadata. Extending a hand-rolled binary parser adds offset arithmetic, versioning branches, and parser complexity. JSON is trivially extensible (add a field), self-documenting, and easy to debug with browser devtools. The 33% base64 overhead on blobs up to 1 MiB is acceptable at this app's scale.

**Alternative considered:** Extend the binary frame with new fixed-width fields. Rejected because it makes future evolution disproportionately complex for a personal-scale app.

### 3. `sync_record` table — single-column UUID primary key

Rename the `updates` table to `sync_record`. The `idempotency_key` column is renamed to `id` and promoted to primary key. The composite `(user_id, seq)` becomes a unique index.

**Why:** Every other table in the schema uses a single-column `id` PK. The `idempotency_key` is already NOT NULL and unique per operation — it is already the row's identity. A UUID PK with a secondary unique index on `(user_id, seq)` has negligible performance difference at this scale (D1, personal app, hundreds of rows per user).

**Alternative considered:** Keep `(user_id, seq)` as PK, add a new surrogate `id`. Rejected — adds a column that serves no query purpose.

### 4. AAD construction

```
"autokpo:e2ee-update:v1:{userId}:{keyId}:{kind}"
```

Encoded as UTF-8 via `TextEncoder`, matching the existing `masterKeyAad` pattern.

**Why:** Binds ciphertext to user (cross-user move fails), key (key-swap fails), and kind (update/snapshot confusion fails). The `idempotencyKey` is intentionally omitted — replay of old Yjs operations is harmless because `Y.applyUpdate` is idempotent and state-vector-aware. Including `idempotencyKey` would require sending it in the pull response, complicating the wire format.

### 5. Master key access via React Context

`EncryptionGate` becomes an `EncryptionContext` provider exposing `{ masterKey: Uint8Array; keyId: string }`. `useSyncEngine` reads this context to obtain key material.

**Why:** The master key lives in `EncryptionGate`'s reducer state. React Context is the idiomatic, zero-coupling way to make it available to `useSyncEngine` without threading props through the component tree. This mirrors `SyncMetadataContext`.

**Alternative considered:** Module-level singleton. Rejected — harder to test, couples runtime lifetime to module lifetime.

## Risks / Trade-offs

- **Base64 overhead** → ~33% larger payloads (on blob and IV). Acceptable at this scale; the 1 MiB ciphertext limit already dominates sizing concerns.
- **Binary migration** → No data migration needed; app is not deployed. New rows are always encrypted.
- **AAD does not bind to seq** → Seq is server-assigned; client cannot include it at encrypt time. Server could theoretically reorder rows, but Yjs CRDT semantics make reordering harmless — updates commute and `Y.applyUpdate` is idempotent.
- **Single active key assumption** → `encryption_key_id` column is stored per row, so key rotation is possible in future. Current implementation reads only the session key.

## Migration Plan

1. Generate D1 migration: rename `updates` → `sync_record`, rename `idempotency_key` → `id`, change PK, add `encryption_key_id` column.
2. Update Drizzle schema file.
3. Update `worker/routes/sync.ts` for JSON wire format and new table/column names.
4. Update `src/crdt/sync-client.ts` for JSON wire format.
5. Add `EncryptionContext` and provider in `src/e2ee/`.
6. Update `EncryptionGate` to provide the context.
7. Add encrypt/decrypt logic in sync engine.
8. Apply migration to local D1 and run tests.

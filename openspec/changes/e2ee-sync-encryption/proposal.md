## Why

Sync blobs are currently stored and transmitted in plaintext, meaning the Cloudflare Worker and D1 database have full visibility into user document contents. Adding E2EE to the sync layer closes this gap — the server stores and forwards opaque ciphertext it cannot read.

## What Changes

- **BREAKING** Rename DB table `updates` → `sync_record` and restructure its schema
- **BREAKING** Replace binary octet-stream wire format with JSON for push, compact, and pull
- Add `encryption_key_id` column to `sync_record` linking each row to the key that encrypted it
- Encrypted blob format: self-contained `[enc_version: u8][iv: 12 bytes][ciphertext…]`
- New `EncryptionContext` React context exposes unwrapped master key to the sync engine
- Sync engine encrypts deltas and snapshots before upload, decrypts records after pull

## Capabilities

### New Capabilities

- `sync-encryption`: End-to-end encryption of Yjs sync blobs — encrypt on push/compact, decrypt on pull, using the unwrapped master key from the encryption session.

### Modified Capabilities

- `crdt-store`: Sync wire protocol changes from binary octet-stream to JSON; `sync_record` table replaces `updates` table with a new schema.
- `e2ee-master-key`: Master key is now surfaced to the sync engine via a React context in addition to its existing wrapping/unwrapping role.

## Impact

- `worker/db/schema/updates.ts` — replaced by `sync_record` schema
- `worker/db/migrations/` — new migration for table rename and schema changes
- `worker/routes/sync.ts` — updated for new JSON wire format and `sync_record` table
- `src/crdt/sync-client.ts` — updated for JSON wire format
- `src/crdt/sync-logic.ts` — encrypt/decrypt hooks added
- `src/e2ee/` — new `EncryptionContext` provider and hook
- `src/e2ee/encryption-gate.tsx` — becomes the context provider

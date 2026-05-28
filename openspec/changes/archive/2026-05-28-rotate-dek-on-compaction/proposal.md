## Why

Compaction is the natural maintenance point for rotating encrypted sync data, but stale clients need deterministic recovery when another client changes the active DEK. Adding key-ring revision metadata to sync rows lets clients distinguish stale key material from hard decryption failures without endless key-ring refetches.

## What Changes

- Rotate the key ring automatically when a sync compaction session starts, then compact with the resulting active DEK and key-ring revision.
- Treat rotation and compaction as independent steps: a successful rotation remains valid even if compaction fails, and compaction retries reuse the same prepared compact request/key/revision.
- Add `keyRingRevision` to every sync upload and download record, including updates and snapshots.
- Require sync writes and compactions to match both the server-current `activeDekId` and key-ring `revision`.
- Include key-ring revision in sync payload AAD so row metadata is authenticated.
- Expose all unlocked DEKs, not only the active DEK, so clients can decrypt old rows by each row's `encryptionKeyId` until compaction removes them.
- Handle stale write-key conflicts silently by refreshing key-ring state, pulling sync data, recomputing pending data, and retrying with the current active key.
- Add a backend key-ring ciphertext size limit to prevent unbounded encrypted key-ring growth from retained DEKs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `e2ee-key-ring`: Add rotation-on-compaction behavior, multi-DEK read exposure, conflict handling for concurrent rotations, and key-ring ciphertext size limiting.
- `sync-encryption`: Add key-ring revision metadata to sync rows, validate revision on writes, authenticate revision in AAD, decrypt rows by row key id, and define compaction retry behavior after rotation.

## Impact

- Client E2EE key-ring crypto/profile handling and encryption context.
- Client sync encryption/decryption, push, pull, compaction, retry, and conflict recovery flows.
- Worker `/api/e2ee/key-ring` update validation for ciphertext size.
- Worker `/api/sync` and `/api/sync/compact` request/response schemas, D1 schema, migrations, and write preconditions.
- Sync encryption, key-ring, worker route, and compaction tests.

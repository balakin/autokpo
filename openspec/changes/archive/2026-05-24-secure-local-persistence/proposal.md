## Why

Local Yjs IndexedDB persistence currently reuses the remote sync DEK and relies on passive Y.Doc update listeners, which couples remote encryption lifecycle to local cache storage and makes durable ordering hard to reason about across tabs. This change separates local persistence encryption from remote sync encryption and makes local durability explicit so remote cursors are advanced only after pulled records are saved locally.

## What Changes

- Introduce a dedicated MEK-wrapped local persistence DEK stored in the same IndexedDB database as encrypted Yjs update rows.
- Replace passive Y.Doc-listener persistence with explicit persistence calls for local updates and leader-controlled remote pulls.
- Serialize local persistence mutations with a Web Locks lock scoped to the user/document database.
- Rotate the local persistence DEK during IndexedDB compaction by atomically replacing the active local key and update log with a compact encrypted snapshot.
- Bind each local encrypted update/snapshot envelope to a generated `id`, `kind`, database/store context, and local key id through AES-GCM AAD.
- Ensure BroadcastChannel-delivered updates are applied in memory only and are not redundantly persisted by every open tab.
- Treat invalid or inconsistent local persistence state as a broken local cache: clear it, recreate local key material, and force remote refetch.

## Capabilities

### New Capabilities

- `local-persistence-encryption`: Defines dedicated local IndexedDB encryption keys, explicit persistence ordering, Web Lock serialization, compaction-time local key rotation, and local-cache recovery behavior.

### Modified Capabilities

- `crdt-store`: Update local persistence, cross-tab fan-out, encrypted cache envelope, and compaction requirements to use explicit encrypted persistence with a dedicated local key.

## Impact

- Affects `apps/app/src/crdt/encrypted-indexeddb-persistence.ts`, CRDT runtime creation, and sync engine update/pull ordering.
- Affects IndexedDB schema for the encrypted Yjs persistence database by adding a local key store and updated envelope schema.
- Affects cross-tab behavior by preventing BroadcastChannel echoes from being stored redundantly.
- Affects remote pull durability ordering by requiring local persistence before sync cursor advancement.
- Does not change the remote sync encryption format or Worker-side sync API.

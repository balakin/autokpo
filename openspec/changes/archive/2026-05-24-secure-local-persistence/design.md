## Context

AutoKPO stores all application state in a single Yjs document and persists the Yjs update log to IndexedDB. The current encrypted IndexedDB persistence uses the remote sync DEK and subscribes passively to Y.Doc update events. That means local cache encryption shares the same lifecycle as remote sync encryption, BroadcastChannel-applied updates can be persisted redundantly by multiple tabs, and the sync engine cannot explicitly await local durability before advancing the remote cursor.

The app already uses Web Locks for network-sync leader election and BroadcastChannel for cross-tab update fan-out. This design keeps the remote sync leader for HTTP work, but introduces a separate short-lived Web Lock for local persistence mutations so any tab can durably persist its own local edits without routing through a leader-owned memory queue.

## Goals / Non-Goals

**Goals:**

- Use a dedicated local persistence DEK for encrypted IndexedDB Yjs rows instead of the remote sync DEK.
- Store the active local persistence DEK as a MEK-wrapped singleton in the same IndexedDB database as the encrypted update rows.
- Make local persistence explicit so callers can await writes before advancing sync state or broadcasting durable assumptions.
- Prevent BroadcastChannel echoes from creating duplicate IndexedDB rows in every open tab.
- Serialize appends, remote persistence, local compaction, local key rotation, and local DB reset with one Web Lock.
- Rotate the local persistence DEK during compaction by atomically replacing the active key and update log with one snapshot encrypted by the new key.
- Treat local persistence corruption as cache loss and recover by clearing local persistence, creating fresh local key material, and forcing remote refetch.

**Non-Goals:**

- No change to remote sync encryption, Worker APIs, or server-side key-ring validation.
- No local key ring or historical local DEK retention; the invariant is one active local key for all live rows.
- No attempt to provide protection against same-origin script compromise. This improves key separation, lifecycle clarity, and at-rest cache handling, but XSS can still access in-memory key material.
- No atomic transaction between IndexedDB and `localStorage` sync state; durability ordering is enforced by writing IndexedDB first and sync state second.

## Decisions

### Dedicated local persistence key

The encrypted local persistence database will add a `local_key` object store containing one active local key record:

```txt
local_key["active"] = {
  id: "active",
  schemaVersion: 1,
  localDekId,
  wrappingAlgorithm: "aes-256-gcm",
  wrappingVersion: 1,
  wrappingIv,
  wrappedDek,
  createdAt
}
```

The local DEK is generated randomly and wrapped by the MEK. The remote active DEK remains reserved for remote sync payloads.

Alternatives considered:

- Reuse the remote DEK: simpler, but couples local cache and remote sync lifecycles.
- Store a local key ring: more tolerant of mixed-key rows, but unnecessary if all mutations are serialized and compaction swaps key+rows atomically.
- Wrap with LDK only: more device-local, but password unlock should also recover the local cache; MEK wrapping matches the existing unlock hierarchy.

### Explicit persistence API

Encrypted IndexedDB persistence should stop subscribing to `ydoc.on('update')` internally. Instead, CRDT/sync orchestration will call explicit methods such as:

```txt
loadIntoDoc(doc)
persistLocalUpdate(update)
persistRemoteUpdates(updates[])
compactAndRotate(doc)
clearAndReinitialize()
```

This makes durable ordering observable to the sync engine. Remote pulls can persist plaintext Yjs updates locally before applying them, broadcasting them, and advancing the cursor.

Alternatives considered:

- Keep passive listener persistence: hides asynchronous writes and makes it hard to guarantee cursor-after-durability ordering.
- Route all writes through the leader tab: avoids duplicate writes, but risks losing queued writes if the leader tab closes before flushing.

### Web Lock for local persistence mutations

All local persistence mutations will acquire the same exclusive Web Lock, for example:

```txt
autokpo:local-persistence:<userId>:<dbName>
```

The lock covers local append, remote pulled update persistence, compaction+rotation, and reset/reinitialize. BroadcastChannel memory application, UI reads, and remote HTTP requests do not need this lock.

Alternatives considered:

- IndexedDB transaction-only optimistic validation: possible, but requires every append and compaction to validate key state and retry on races. Web Locks produce simpler reasoning.
- Leader-only local writer: simpler single writer but introduces a leader-owned volatile queue.

### One active local key with atomic compaction rotation

The system will maintain this invariant:

```txt
All live encrypted update rows are decryptable by the active local key.
```

Compaction prepares outside the final transaction while holding the local persistence Web Lock: read rows, decrypt with current local DEK, encode snapshot, generate/wrap a new local DEK, and encrypt the snapshot with the new DEK. The final commit uses one IndexedDB `readwrite` transaction over `local_key` and `updates` to replace the key and replace the log.

Crash behavior:

```txt
before transaction  -> old key + old rows remain
during transaction  -> IndexedDB commits old or new state atomically
after transaction   -> new key + new snapshot are committed
```

### Local encrypted envelope identity and AAD

Each local encrypted row will include a generated `id` and `kind`:

```txt
{
  schemaVersion: 1,
  kind: "update" | "snapshot",
  id,
  encryptionAlgorithm: "aes-256-gcm",
  encryptionVersion: 1,
  encryptionKeyId: localDekId,
  iv,
  ciphertext
}
```

AES-GCM AAD will bind the row to its local domain, for example:

```txt
autokpo:yjs-indexeddb:v1:<dbName>:updates:<kind>:<id>:<localDekId>
```

This prevents valid ciphertext from being moved between row identities, kinds, databases, or keys without authentication failure.

### Broadcast updates are memory-only

Updates received via BroadcastChannel are applied to the local Y.Doc with an origin ignored by persistence/sync side effects. They update open tabs immediately but do not create IndexedDB rows. The originating tab persists its own local update under the local persistence lock. The remote sync leader persists pulled remote updates before broadcasting them.

### Cursor advancement after local durability

Remote pull handling will write pulled plaintext updates to encrypted local persistence before advancing the local sync cursor. Since the cursor is in `localStorage`, this is ordered rather than transactional:

```txt
persist remote updates to IndexedDB
apply/broadcast updates
write cursor/head to localStorage
```

If the app crashes after persistence but before cursor advancement, the next pull may replay duplicate Yjs updates, which is safe. If the cursor advances, the records are already durable locally.

## Risks / Trade-offs

- Web Locks unavailable or interrupted → provide the same fallback/error behavior as existing leadership code; if local persistence cannot safely mutate, treat local persistence as unavailable and recover through remote sync.
- Local persistence write latency increases because writes acquire a lock → mutation sections are small for appends, while compaction remains infrequent.
- Holding the Web Lock during compaction preparation blocks local persistence appends → compaction already serializes update-log replacement; blocking preserves the one-key invariant.
- Local DB reset can discard unsynced local-only changes → this is accepted for corruption/key mismatch recovery; normal local updates are explicitly persisted before sync cursor assumptions change.
- IndexedDB and `localStorage` cannot commit atomically → persist-first ordering makes duplicate remote replay possible but avoids cursor-advanced/data-missing loss.
- Existing cached rows are out of scope before release → version 1 can define the final local persistence shape directly.

## Initialization Plan

1. Keep the encrypted local persistence IndexedDB at version 1 and create both `updates` and `local_key` stores in the initial upgrade callback.
2. On first open with missing local key/envelope state, create a fresh MEK-wrapped local DEK and reset sync cursor as needed to pull remote state.
3. Keep remote key-ring and sync encryption records unchanged.
4. Rollback before release is a code/spec revert; no production cache migration is required.

## Open Questions

- Should the local AAD include `userId` in addition to `dbName` if database naming is already user-scoped?
- Should local corruption reset preserve `dirty` sync state or force a full refetch before any pending push attempt?

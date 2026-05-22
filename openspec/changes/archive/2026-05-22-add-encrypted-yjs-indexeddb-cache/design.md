## Context

AutoKPO stores all cross-device application data in a single Yjs document. The document is currently persisted locally through `y-indexeddb`, which writes raw Yjs update bytes into IndexedDB and exposes a `whenSynced` promise used by `CrdtProvider` to delay rendering until local hydration completes.

The app now unlocks a session master key before mounting the signed-in CRDT runtime and encrypts server sync payloads with AES-256-GCM. That means `CrdtProvider` can create local persistence only after `{ masterKey, keyId }` are available, but the existing IndexedDB connector still persists plaintext Yjs data at rest.

The app is not released, so there is no need to migrate existing `y-indexeddb` databases or preserve old plaintext caches.

## Goals / Non-Goals

**Goals:**

- Replace `y-indexeddb` with an app-owned `EncryptedIndexeddbPersistence` connector.
- Preserve the current Yjs persistence lifecycle: load cache before render, append Yjs updates while running, ignore updates applied by the persistence provider itself, compact the log after 500 updates, and expose a `whenSynced` readiness promise.
- Encrypt every persisted Yjs update or compacted snapshot with AES-256-GCM using the unlocked session master key.
- Use an IndexedDB envelope that records `schemaVersion`, `encryptionAlgorithm`, `encryptionVersion`, `encryptionKeyId`, `iv`, and `ciphertext`.
- Treat local cache as disposable: when IndexedDB cannot be opened/read/decrypted or has unsupported metadata, delete it if possible and continue as an empty cache.
- Remove the `y-indexeddb` dependency and tests/mocks after replacement.

**Non-Goals:**

- Migrating plaintext `y-indexeddb` data.
- Supporting mixed encrypted/plaintext cache formats.
- Implementing key rotation or cache re-encryption.
- Hiding metadata such as database name, user id, update count, or ciphertext sizes.
- Creating a general-purpose IndexedDB encryption library beyond the Yjs cache connector.
- Implementing unused `y-indexeddb` custom key/value APIs unless discovery shows the app uses them.

## Decisions

### Own a small connector instead of forking or wrapping `y-indexeddb`

Implement `EncryptedIndexeddbPersistence` in the app and wire it where `IndexeddbPersistence` is currently constructed.

Alternatives considered:

- Fork `y-indexeddb`: faster to start, but keeps the app tied to a library-shaped abstraction whose core behavior is plaintext persistence.
- Monkey-patch or wrap IndexedDB calls under `y-indexeddb`: brittle and difficult to audit for a security boundary.
- Store one encrypted full snapshot only: simpler but loses the existing append-log behavior and can increase write cost.

Owning the connector keeps the security boundary small, auditable, and tailored to the app's exact lifecycle.

### Preserve `y-indexeddb` persistence semantics

The connector will follow the current provider model:

- an `updates` object store with auto-increment keys;
- startup reads updates in key order and applies them to the Y.Doc with origin set to the persistence instance;
- runtime listens to `ydoc.update` and persists all updates where `origin !== this`;
- remote sync updates are persisted, because only provider-replayed updates should be ignored;
- compaction writes `Y.encodeStateAsUpdate(doc)` and deletes older update rows after the 500-update threshold;
- `destroy()` removes listeners/closes storage, and `clearData()` deletes the database.

This preserves the existing bootstrap/render ordering and keeps backend sync behavior unchanged.

### Encrypt each stored update independently

Each row in the `updates` store will contain an object envelope:

```ts
type EncryptedIndexeddbEnvelope = {
  schemaVersion: 1;
  encryptionAlgorithm: 'aes-256-gcm';
  encryptionVersion: 1;
  encryptionKeyId: string;
  iv: Uint8Array;
  ciphertext: Uint8Array;
};
```

The plaintext is the Yjs update bytes or compacted snapshot bytes. `iv` is a random 12-byte AES-GCM IV. The connector reuses the app's existing AES-GCM primitives rather than introducing another crypto implementation.

AAD is the UTF-8 encoding of:

```text
autokpo:yjs-indexeddb:v1:<dbName>:updates:<keyId>
```

This binds the ciphertext to the local cache purpose, database name, store, and active encryption key id without complicating auto-increment row allocation.

### Treat cache failures as cache misses

If the connector cannot open IndexedDB, cannot parse/decrypt an envelope, sees an unsupported algorithm/version/schema, or otherwise fails while loading persisted rows, it will behave as if no cache exists. When possible it deletes the database before continuing empty.

The server sync layer remains the source of truth for recovering state. This is safer than applying partially decrypted or suspect data to the Y.Doc.

### Implement only used public API

The app currently constructs the persistence connector and waits on readiness. The replacement should implement the used API surface (`whenSynced`, event emission if still consumed, `destroy`, `clearData`) and should not implement `get/set/del` custom storage unless usage is found during implementation.

## Risks / Trade-offs

- Cache clear causes slower first load after corruption or unsupported metadata → backend sync repopulates the Y.Doc and the encrypted cache.
- IndexedDB unavailable means no local durable cache for that browser session → app continues without local persistence rather than blocking signed-in use.
- App-owned connector must correctly preserve Yjs update ordering and origin filtering → tests cover hydration, runtime persistence, remote-update caching, compaction, destroy, and clear behavior.
- Encrypted rows still leak metadata such as update count and approximate payload sizes → acceptable for the local-at-rest threat model.
- Skipping legacy migration can discard old local data → acceptable because the app is unreleased and old caches are out of scope.

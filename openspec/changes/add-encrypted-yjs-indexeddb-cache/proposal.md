## Why

Local-first Yjs state is currently persisted through `y-indexeddb`, which stores raw Yjs update bytes in IndexedDB. The app now has master-key unlock and encrypted server sync, so the remaining plaintext copy of CRDT application data is the local IndexedDB cache.

## What Changes

- Replace `y-indexeddb` with an app-owned `EncryptedIndexeddbPersistence` connector for the Y.Doc cache.
- Encrypt every persisted Yjs update/snapshot in IndexedDB using the unlocked session master key.
- Keep the existing startup behavior: React renders only after IndexedDB hydration finishes, and backend sync remains the canonical recovery path when local cache is unavailable or invalid.
- Treat unreadable, undecryptable, unsupported, or unavailable IndexedDB cache as absent; delete it when possible and continue with an empty local cache.
- Compact the encrypted update log after the same threshold as `y-indexeddb` to avoid replaying unbounded update histories.
- Remove the `y-indexeddb` runtime dependency and its test mock once the replacement connector is in use.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `crdt-store`: Local Yjs IndexedDB persistence changes from `y-indexeddb` plaintext storage to app-owned encrypted persistence while preserving hydration, bootstrap, and local-first semantics.

## Impact

- Affected app code: `apps/app/src/crdt/doc.ts`, `apps/app/src/crdt/crdt-provider.tsx`, new CRDT persistence/crypto helpers, and related tests.
- Affected encryption code: reuse existing AES-GCM primitives and the unlocked `{ masterKey, keyId }` encryption context.
- Affected dependencies: remove `y-indexeddb` after the encrypted connector replaces it.
- No migration is required because the app is unreleased and old local caches can be ignored or deleted.

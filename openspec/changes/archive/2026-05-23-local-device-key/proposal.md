## Why

After the user authenticates, the app still shows an encryption password prompt on every session — even on the same trusted device. A device-bound local key eliminates this prompt while keeping the password as a durable offline fallback.

## What Changes

- Introduce a **Local Device Key (LDK)**: a random AES-256-GCM key generated on first password unlock and stored as a non-extractable `CryptoKey` in IndexedDB. The LDK wraps the MEK locally so subsequent sessions on the same device auto-unlock without a password prompt.
- Replace **localStorage key-ring cache** with a typed IndexedDB database (`autokpo-e2ee`) containing three object stores: `key_ring`, `wrapper` (persistent, password-based), and `local_wrapper` (session-scoped, device-based).
- The `wrapper` store persists the password-based wrapped MEK locally for **offline fallback** unlock without contacting the backend.
- The `local_wrapper` store is deleted on logout. It holds the LDK and the LDK-wrapped MEK. Its `method` field (`'ldk'` now, `'pin'` in a future iteration) allows adding new local unlock methods without schema changes.
- Create `src/indexeddb/` with shared IndexedDB utilities reused by both the new e2ee store and the existing `crdt/encrypted-indexeddb-persistence.ts`.
- No backend changes.

## Capabilities

### New Capabilities

- `local-device-key`: LDK generation, session-scoped `local_wrapper` IndexedDB storage, auto-unlock path that skips the password prompt when an LDK is present, and logout cleanup.

### Modified Capabilities

- `e2ee-key-ring`: Key-ring profile cache moves from localStorage to the `key_ring` IndexedDB object store. Password wrapper is additionally cached locally in the `wrapper` store for offline unlock without a backend fetch.
- `encryption-unlock-ui`: When a valid `local_wrapper` exists, the gate auto-unlocks without showing the password prompt. The unlock screen is only shown when no LDK is available.

## Impact

- **`src/e2ee/`**: new `KeysIndexeddb` class (`keys-indexeddb.ts`), updated `EncryptionGate`, updated `cleanup.ts` logout hook, removal of `key-ring-cache.ts`.
- **`src/indexeddb/`**: new shared module (`idb.ts`) extracted from `encrypted-indexeddb-persistence.ts`.
- **`src/crdt/encrypted-indexeddb-persistence.ts`**: refactored to import shared primitives from `src/indexeddb/idb.ts`.
- **No worker or backend changes.**
- **New dev dependency**: none — `fake-indexeddb` already present.

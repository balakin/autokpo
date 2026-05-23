## Context

The current e2ee system requires the encryption password on every new authenticated session. The key-ring profile (key ring ciphertext + password wrapper) is cached in localStorage. There is no device-level key material — every unlock requires Argon2id derivation from the password.

The existing `wrappers` array in the server response is already plural, designed to support multiple unlock methods. The `cleanup.ts` module has a stub comment: "Future device/PIN unlock material should be cleared here." The system was designed to accommodate this change.

## Goals / Non-Goals

**Goals:**

- Auto-unlock e2ee on session load when a device key is present (no password prompt)
- Replace localStorage key-ring cache with a typed IndexedDB database
- Persist password-wrapped MEK locally for offline unlock without a backend fetch
- Introduce `local_wrapper` schema that accommodates PIN as a future method with no further schema changes
- Extract shared IndexedDB primitives into `src/indexeddb/idb.ts`

**Non-Goals:**

- PIN unlock (schema is prepared, not implemented)
- Backend changes of any kind
- Cross-device key authorization
- Device revocation via a server-side device registry

## Decisions

### Decision: LDK is a local method, not a tier

The LDK wraps MEK directly — the same level as the password wrapper. A two-level chain (PIN → LDK → MEK) was considered but rejected: it adds indirection without benefit for the current scope. The `local_wrapper.method` field makes PIN a peer method later, not a wrapper-of-LDK.

### Decision: LDK is session-scoped, deleted on logout

LDK is deleted from IndexedDB on logout. The user must re-enter their password on the next login session. This matches Proton Pass's behavior (PIN is per-session). The `scope` field in `local_wrapper` makes this explicit and extensible.

**Alternative considered**: persist LDK across logouts ("trusted device"). Rejected as default — security-correct default first, trusted-device toggle can be added later.

### Decision: Three IndexedDB object stores, one database

```
autokpo-e2ee
  key_ring       keyPath: userId   — key ring ciphertext cache (replaces localStorage)
  wrapper        keyPath: userId   — persistent password-based MEK wrapper
  local_wrapper  keyPath: userId   — session-scoped device/PIN MEK wrapper
```

`wrapper` and `local_wrapper` are separate stores rather than a single `key_wrappers` store with `method` in the keyPath. Rationale: they have different schemas (wrapper always has KDF fields; local_wrapper has discriminated fields per method) and different lifecycles (wrapper persists, local_wrapper is deleted on logout). Separate stores make logout a single-store delete and make TypeScript types clean without optional fields.

**Alternative considered**: single `key_wrappers` store with `[userId, method]` keyPath. Rejected because wrapper and local_wrapper are mutually exclusive in their field shapes, and the mixed-fields design pushes discriminated-union handling into every read/write path.

### Decision: LDK CryptoKey stored non-extractable in `local_wrapper`

The LDK is stored as a non-extractable `CryptoKey` directly in the `local_wrapper` record alongside the LDK-wrapped MEK ciphertext. This means:

- The LDK can never be read from JS memory — only used for WebCrypto operations
- If the user later wants PIN, a new extractable LDK is generated, the MEK is re-wrapped, and the non-extractable LDK record is replaced

### Decision: `wrapper` store is populated on first password unlock per device

On first password unlock (or any unlock when the `wrapper` store is empty), the password wrapper fields from the server response are written to the local `wrapper` store. This enables subsequent offline unlocks without a backend fetch. The `wrapper` store is not session-scoped — it persists until account deletion.

The `wrapper` record includes `wrappingId` (the server-assigned wrapper UUID) so the AAD `autokpo:e2ee-wrapped-mek:v1:{userId}:{wrappingId}:password` can be reconstructed exactly during offline unlock without a backend fetch.

The `wrapper` store schema:

```
wrapper
  keyPath:       userId
  unique index:  wrappingId

userId              string PK
method              'password'
wrappingId          string  (unique) ← server wrapper UUID, needed for AAD reconstruction
ciphertext          Uint8Array
wrappingIv          Uint8Array
wrappingAlgorithm   'aes-256-gcm'
wrappingVersion     number
kdfAlgorithm        'argon2id'
kdfVersion          number
kdfParams           object
kdfSalt             Uint8Array
createdAt           string
```

### Decision: keyRingId retained in local key_ring store for now

`keyRingId` is kept in the local `key_ring` store for staleness detection (comparing local vs server version). Removing it from the backend as a surrogate key (since one user = one key ring, making `userId` a sufficient PK) is deferred to a follow-up change.

### Decision: Shared IndexedDB primitives in `src/indexeddb/idb.ts`

`openDatabase`, `withStore`, `requestToPromise`, `toError`, `deleteDatabase` are extracted from `encrypted-indexeddb-persistence.ts` into a shared module. The `withStore` signature is generalized to accept the store name as a parameter. Both the e2ee store and the CRDT persistence layer import from this module.

### Decision: `KeysIndexeddb` class, initialized in `EncryptionGate`

Mirrors the `EncryptedIndexeddbPersistence` pattern: constructor opens the DB, `whenReady` promise, typed methods per store. A single instance is created via `useRef` in `EncryptionGateForUser` (which already re-mounts on `userId` change via `key={userId}`).

## Risks / Trade-offs

**Non-extractable LDK blocks future PIN without re-wrap** → Accepted. Adding PIN requires re-generating an extractable LDK and re-wrapping MEK. This is a one-time user action and is well-defined behavior.

**IndexedDB unavailable in some private-browsing modes** → The gate already handles failure paths. If `KeysIndexeddb` fails to open, fall back to password unlock. The `wrapper` store offline path requires IndexedDB, but the server fetch path remains available.

**LDK wrapper and MEK in same record** → The LDK (non-extractable CryptoKey) is the only way to decrypt the MEK ciphertext in the same record. Storing them together is safe: security comes from the non-extractability of the key and the device-bound storage, not from separation of key and ciphertext.

## Migration Plan

No migration needed — the project has no production users. localStorage cache is dropped. IndexedDB is initialized fresh on first load. On first password unlock after deploy, `wrapper` and `key_ring` stores are populated from the server response.

## Open Questions

None — all design decisions resolved during exploration.

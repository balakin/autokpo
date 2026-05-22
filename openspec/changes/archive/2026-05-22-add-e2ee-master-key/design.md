## Context

The app already gates signed-in routes behind encryption setup/unlock UI, but the current state is local-only placeholder state. The first real E2EE step is to create a user master key in the browser, wrap it with an encryption-password-derived key, persist only the wrapped key and public parameters, and unlock the plaintext master key in memory for the current app session.

The app runs as a React PWA with a Cloudflare Worker backend and D1/Drizzle storage. The frontend must support offline unlock after the wrapped key has been cached locally, while the backend remains the source of truth for authenticated setup and cross-device retrieval.

## Goals / Non-Goals

**Goals:**

- Generate a random 32-byte master key in the browser during first-time encryption setup.
- Derive a key-encryption key from the encryption password with `hash-wasm` Argon2id in a dedicated Web Worker and a random salt.
- Wrap the master key with AES-256-GCM and save only the wrapped master key plus public parameters.
- Store key identity separately from password wrapping records to support future password changes, recovery wrappings, and key rotation.
- Cache the wrapped password wrapping in localStorage for offline unlock.
- Keep the plaintext master key only in memory after setup/unlock.

**Non-Goals:**

- Encrypting Yjs/app data.
- PIN unlock, device-key unlock, biometrics, or keep-unlocked behavior.
- Recovery keys or destructive reset flows.
- Key rotation or algorithm migration execution.
- Sending the encryption password, KEK, or plaintext master key to the backend.

## Decisions

### Use `hash-wasm` Argon2id for password-to-KEK derivation

Use `hash-wasm` Argon2id with versioned parameters for password-based key derivation. The initial profile is 16-byte random salt, 32-byte output, 64 MiB memory, 3 iterations, and parallelism 1.

Argon2id SHALL run in a dedicated browser Web Worker so the expensive KDF does not block the React/UI thread. The worker returns only derived KEK bytes to the main thread. AES-GCM wrapping/unwrapping remains on the main thread through native Web Crypto because it is fast, browser-native, and keeps the worker focused on the KDF.

Alternatives considered:

- PBKDF2-HMAC-SHA-256: native Web Crypto support, but weaker against GPU attacks and less aligned with current password-KDF guidance.
- scrypt: memory-hard, but not native Web Crypto and less preferred than Argon2id for new designs.
- `argon2-browser`: supports Argon2id, but has a more brittle bundler/WASM integration profile for new Vite apps.
- `libsodium-wrappers-sumo`: strong and maintained, but too large if this change only needs Argon2id rather than a full crypto toolkit.

### Use AES-256-GCM for wrapping the master key

Use Web Crypto AES-GCM with a 32-byte KEK and 12-byte random IV to encrypt the 32-byte master key. AES-GCM provides authentication, so incorrect passwords or tampered wrapped key records fail during unwrap.

The wrapping operation uses deterministic AAD derived from stable metadata:

```txt
autokpo:e2ee-master-key:wrap-v1:{userId}:{keyId}:{wrappingId}
```

The AAD is not stored separately; it is reconstructed from stored row fields.

### Split master keys from wrappings

Create two backend tables:

- `user_encryption_key`: actual master key identity and lifecycle metadata.
- `user_encryption_key_wrapping`: one encrypted way to unlock a master key.

For v1 each user has one active key and one active password wrapping. Future password changes can add a new wrapping for the same `key_id`; future recovery can add another wrapping; future key rotation can add a new `key_id`.

### Use immutable records with revocation timestamps

Do not update crypto material in place. If a wrapping changes later, insert a new wrapping and revoke the old one. For v1 setup creates rows once; `revoked_at` is reserved for future lifecycle changes.

### Cache only wrapped material locally

localStorage may cache the active key metadata and password wrapping so the user can unlock offline after a successful online setup/retrieval. The cache contains only wrapped encrypted material and public KDF/wrap parameters. The plaintext master key is held only in memory and cleared on logout/user switch/session cleanup.

### Initial backend check before setup/unlock

When no cached key record exists for the authenticated user, the gate fetches the active key from the backend before deciding whether to show setup or unlock UI. This prevents creating a duplicate key when one already exists on the backend but has not yet been cached locally.

- Cached record present → skip backend check, go directly to `locked` state.
- No cached record → fetch `/api/e2ee/key`. On success: cache record, go to `locked`. On 404: go to `uninitialized` (setup). On other error: show "cannot verify" UI with retry; block setup until a check succeeds.

### Master key held in gate reducer state

The plaintext master key is stored as `Uint8Array | null` inside the `EncryptionGateState` produced by `encryptionGateReducer`. It is never persisted. The outer `EncryptionGate` renders `EncryptionGateForUser` with `key={userId}`, so React unmounts the subtree when the user changes, clearing the in-memory master key automatically.

## Risks / Trade-offs

- **Argon2id WASM adds bundle/performance cost** → Use `hash-wasm`, load it only through the KDF worker where encryption setup/unlock needs it, and keep parameters versioned so they can be tuned.
- **64 MiB Argon2id may be slow on weak devices** → Run it off the UI thread in the KDF worker, validate UX on mobile-class devices, and adjust the v1 profile only before broad rollout if needed.
- **localStorage cache can be stolen by local/XSS compromise** → Cache only encrypted wrapped keys; never cache plaintext keys. Continue treating XSS prevention as critical.
- **Offline cache may become stale after future wrapping changes** → Include versions, IDs, and revocation-aware backend retrieval; for v1, backend remains authoritative when online.
- **No recovery means forgotten encryption password loses access** → Preserve existing non-recoverability UI copy and avoid any reset claim in this change.

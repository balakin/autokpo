## Context

The app already has two MEK wrapper types:

- **password wrapper** — server-side, MEK encrypted with Argon2id(password) KEK
- **ldk wrapper** — local IndexedDB, MEK encrypted with a non-extractable AES-256-GCM CryptoKey (LDK); provides silent auto-unlock

The `local_wrapper` IndexedDB store (keyPath: `userId`) holds at most one record per user. The LDK spec already anticipated a future `method: 'pin'` record in the same store.

Argon2id runs in an existing KDF Web Worker (`kdf-worker.ts`), keeping the UI thread unblocked during derivation.

## Goals / Non-Goals

**Goals:**

- Add a `method: 'pin'` local wrapper that hardware-binds the KDF salt via a dedicated non-extractable pinLDK
- Show a 6-digit PIN screen at the encryption gate when a PIN wrapper is present
- Add a Security settings tab for switching between LDK and PIN, and changing PIN
- Limit brute-force exposure with a 10-attempt wipe that falls back to password unlock

**Non-Goals:**

- Server-side PIN — the PIN wrapper is entirely local
- Biometrics integration
- PIN complexity beyond 6 digits (future)
- Changing the encryption password from Settings

## Decisions

### Decision: Dedicated pinLDK, not shared with MEK-wrapping LDK

A fresh non-extractable AES-256-GCM CryptoKey (`pinLdk`) is generated each time a PIN wrapper is created. It is stored in IndexedDB alongside the PIN wrapper record. It is separate from the MEK-wrapping LDK used in `method: 'ldk'` records.

**Rationale:** Separation of concerns — compromise of the pin-salt-encryption key does not affect the MEK-wrapping LDK, and vice versa. Simpler lifecycle: pinLdk is created and deleted together with its PIN wrapper record.

**Alternative considered:** Reuse the existing LDK. Rejected because once a PIN is set the LDK wrapper is deleted, so there is no existing LDK to reuse.

### Decision: Hardware-bind the KDF salt via pinLDK

The random KDF salt (16 bytes) is stored encrypted with the pinLDK, not in plaintext. On unlock the app decrypts the salt using the pinLDK, then runs Argon2id(PIN, decrypted_salt).

**Rationale:** An offline attacker who copies raw IndexedDB bytes cannot decrypt the KDF salt without the pinLDK. Since `extractable: false` CryptoKeys are encrypted at rest by the browser using OS-level protection (DPAPI / Keychain / Android Keystore), raw disk access does not yield the key material. An XSS attacker running in-origin can invoke the pinLDK but cannot export it, so offline brute-force from a stolen key is blocked. The attacker is limited to in-browser guessing, which is rate-limited by the KDF cost and the 10-attempt wipe.

**Alternative considered:** Store the salt in plaintext. Rejected — eliminates hardware binding and reduces offline brute-force resistance to raw Argon2id cost (~11 days at current params).

### Decision: Reuse KDF_PARAMS_V1 (64 MB / 3 iter / parallelism 1)

PIN wrapper uses the same Argon2id parameters as the password wrapper.

**Rationale:** The hardware-binding via pinLDK makes offline brute-force infeasible regardless of KDF strength. Heavier params would increase legitimate unlock latency on mobile (currently ~1–3 s at 64 MB) without meaningful security gain given the pinLDK binding. The existing KDF worker is reused with no changes.

### Decision: Mutual exclusion — one local_wrapper per user

Setting a PIN deletes the LDK wrapper and writes a PIN wrapper. Switching back to LDK generates a new LDK and replaces the PIN wrapper. The `local_wrapper` store keyPath remains `userId`.

**Rationale:** Avoids IndexedDB schema migration (no DB version bump). Matches user mental model — one active local unlock method. Simplifies gate logic: read one record, branch on `method`.

**Alternative considered:** Store both in the same record or change the keyPath to `userId:method`. Rejected — increases complexity, requires a DB migration, and the use case (coexistent LDK + PIN) adds no security value.

### Decision: 10 failed attempts wipe the PIN wrapper

Each failed PIN entry increments `failedAttempts` in the `local_wrapper` record. At 10 failures the record is deleted, restoring the password unlock path.

**Rationale:** Limits in-app brute-force to 10 guesses (1/100,000 hit rate on a random 6-digit PIN). Storing the counter inside the wrapper record makes the wipe atomic — deleting the wrapper also deletes the counter. An offline attacker bypasses this, but they are already blocked by pinLDK hardware binding.

### Decision: AAD for both AES-GCM operations

Two distinct AAD functions:

- **pinSaltAad** — binds the encrypted KDF salt to `userId` and `wrapperId`: `autokpo:e2ee-pin-salt:v1:{userId}:{wrapperId}`
- **wrappedMekAad** — existing function, called with method `'pin'`: `autokpo:e2ee-wrapped-mek:v1:{userId}:{wrapperId}:pin`

**Rationale:** AAD prevents ciphertext transplanting between users or wrapper instances. Neither value needs to be stored — both are recomputed from fields already in the record.

### Decision: No current-PIN confirmation when changing PIN in Settings

The user is already authenticated (signed in) and encryption is unlocked (MEK is in context). Requiring the current PIN before changing provides no additional security in this trust context.

**Rationale:** The signed-in, unlocked session is the authentication boundary. Requiring the current PIN would be UX friction without security benefit — the attacker who can reach this screen already has session access.

## Risks / Trade-offs

**OS-level key protection varies by platform** → On Linux without a configured keyring, Chromium may not encrypt IndexedDB content, weakening pinLDK hardware binding. The PIN still provides KDF-based protection; the pinLDK binding is a best-effort enhancement. No mitigation needed; document as a known limitation.

**10-attempt wipe is bypassable offline** → An attacker who copies IndexedDB bytes before triggering the wipe can attempt brute force indefinitely offline — blocked only by pinLDK hardware binding, not the counter. Acceptable: the hardware binding addresses this vector.

**KDF takes 1–3 s on mid-range mobile** → The PIN screen must show a visible loading state during Argon2id derivation. The KDF worker keeps the UI unblocked; the spinner is the only mitigation needed.

**PIN wrapper lost if browser data is cleared** → Same behavior as the LDK wrapper today; user falls back to password unlock. No new failure mode introduced.

## Migration Plan

No server-side changes. No IndexedDB schema version bump (existing `local_wrapper` store, same keyPath, new record shape for `method: 'pin'`). The `readLocalWrapper` reader already returns `null` for unrecognized shapes, so stale records are handled gracefully.

Rollback: remove the PIN code path from the gate, delete the Security settings tab, redeploy. Users with a PIN wrapper will find no matching method on gate check, fall through to password unlock, and have the stale record overwritten by a new LDK wrapper after password unlock succeeds.

## Open Questions

None — all design decisions resolved during exploration.

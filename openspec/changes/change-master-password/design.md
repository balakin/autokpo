## Context

AutoKPO stores encrypted key-ring material server-side and keeps plaintext MEK/DEK material only in the unlocked browser session. The current server record has one `key_ring` row per user and one active `key_ring_wrapping` row for the password method, with revoked wrappers retained historically and a database constraint enforcing at most one active wrapper per user/method.

Local unlock is separate from the server password wrapper. The `local_wrapper` IndexedDB store can contain an LDK or PIN wrapper that unwraps the same MEK locally. Changing the master password must therefore rotate only the server-side password-derived KEK wrapper, not the MEK, DEK, key ring, local wrapper, or encrypted local app data.

The flow is security-sensitive and spans UI, browser crypto, IndexedDB/cache behavior, and the worker API. It also needs stale-wrapper protection because another tab or device could replace the active password wrapper first.

## Goals / Non-Goals

**Goals:**

- Provide a Change master password modal from Settings → Security while encryption is unlocked.
- Require fresh local confirmation before creating the new server password wrapper.
- Rewrap the existing MEK with a KEK derived from the new master password.
- Atomically replace the active server-side password wrapper using `currentWrappingId` compare-and-swap semantics.
- Preserve local encryption material and local unlock wrappers.
- Refetch the key-ring profile after success so the local encrypted cache reflects the new active password wrapper.

**Non-Goals:**

- Rotating the MEK or DEK.
- Re-encrypting local app data or CRDT payloads.
- Changing, deleting, or regenerating LDK/PIN local wrappers as part of a successful password change.
- Invalidating authenticated sessions or broadcasting the change across tabs.
- Server-side proof that the new ciphertext decrypts to the same MEK; the server does not know the MEK or KEK.

## Decisions

### Change only the password wrapper

The client will use the already-unlocked MEK from encryption context and produce a new password wrapper with a new wrapper id, salt, IV, and ciphertext. The key ring ciphertext and active DEK id remain unchanged.

Alternatives considered:

- Rotate MEK/DEK during password change. Rejected because the requested behavior is password/KEK rotation only and local encryption should remain unchanged.
- Require local wrapper regeneration after password change. Rejected because local wrappers wrap the same MEK and do not depend on the server password wrapper.

### Fresh confirmation depends on current local unlock method

The modal will first verify access before accepting/submitting the new password:

- if the current local wrapper is PIN, the user enters the PIN;
- otherwise, the user enters the current master password.

Both verification modes allow 10 failed attempts. Reaching the limit clears the unlocked encryption session and returns the user to the encryption gate. PIN failures use the existing PIN verification semantics for failure counting and wipe behavior.

Alternatives considered:

- Always require current master password. Rejected because a PIN local wrapper is an accepted local confirmation factor and can unwrap the same MEK.
- Require both PIN and current password. Rejected as unnecessary friction for the defined security model.

### Add explicit change-password endpoint

The worker will expose `POST /api/e2ee/key-ring/change-password`. The request includes `currentWrappingId` plus the new password wrapper fields. The response is success-only; the client refetches the key-ring profile after success.

The endpoint validates only public structure and supported parameters: UUIDs, KDF/wrapping versions, algorithm names, KDF params, IV/salt/ciphertext lengths, and authenticated user ownership. It cannot verify the wrapper decrypts to the same MEK.

Alternatives considered:

- Return the full profile from the change endpoint. Rejected to keep the endpoint narrowly command-like and reuse the existing profile fetch/cache path.
- Reuse `POST /api/e2ee/key-ring`. Rejected because setup and password replacement have different conflict and lifecycle semantics.

### Server replacement uses compare-and-swap semantics

The server transaction must revoke the active password wrapper only when its id matches `currentWrappingId`, then insert the new active password wrapper. If the current id does not match, or the active wrapper changed before the transaction commits, the endpoint returns a conflict. The client responds by clearing the encryption session and refetching the key-ring profile.

The transaction must preserve the database invariant of at most one active password wrapper per user/method.

Alternatives considered:

- Blindly revoke whatever wrapper is active. Rejected because it could overwrite a concurrent password change from another tab/device.
- Let the unique active-wrapper constraint be the only conflict mechanism. Rejected because the client needs a clear stale-wrapper conflict result.

### Refetch updates the encrypted local cache

After a successful server change, the client refetches `/api/e2ee/key-ring`. The existing fetch/cache path writes the encrypted key-ring profile and active password wrapper into IndexedDB. The `local_wrapper` record is not changed.

If the refetch fails after the server has already changed the password, the current error handling is used. On the next unlock, the user will be asked for the new password and the latest server profile will be fetched.

## Risks / Trade-offs

- New wrapper may be malformed semantically even if structurally valid → Client creates and can locally verify the wrapper before sending; server validates all public parameters but cannot decrypt by design.
- Server success followed by client refetch failure leaves local encrypted cache stale → Existing unlock flow can fetch the latest server profile later; UI surfaces the refetch error.
- Concurrent password changes can race → `currentWrappingId` compare-and-swap and active-wrapper uniqueness produce a conflict; client clears encryption session and refetches.
- Clearing only encryption session leaves authenticated session active → This matches existing unlock separation and avoids signing out the user unnecessarily.
- PIN verification in a settings modal duplicates unlock behavior → Reuse existing PIN helper semantics and tests to avoid divergent retry/lockout rules.

## Migration Plan

- No database migration is expected because existing wrapper lifecycle columns and uniqueness constraints support password replacement.
- Deploy the worker endpoint and client UI together.
- Rollback is safe if no schema changes are introduced; existing active password wrappers remain readable by the current unlock flow.

## Open Questions

- None.

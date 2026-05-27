## Context

The E2EE key ring is currently created during setup and then treated as immutable. The backend stores `activeDekId`, encryption metadata, IV, ciphertext, and active password wrapper rows, while the browser decrypts the key ring locally and caches only encrypted profile data in IndexedDB.

Future DEK rotation needs a safe mutation point for the encrypted key-ring payload. Without a revisioned compare-and-swap, two tabs/devices can both base changes on the same encrypted key-ring state and the later write can lose the earlier encrypted payload. Sync uploads already enforce that `encryptionKeyId` matches the stored `key_ring.activeDekId` at write time, so active-DEK updates also become a write barrier for future sync records.

## Goals / Non-Goals

**Goals:**

- Add a distinct key-ring `revision` for optimistic concurrency, separate from crypto format fields such as `encryptionVersion`.
- Bind encrypted key-ring ciphertext to `userId`, `activeDekId`, and `revision` through AES-GCM AAD.
- Store the same revision inside the encrypted key-ring plaintext and reject decrypted payloads whose revision or active DEK id does not match metadata.
- Add a full key-ring update endpoint that returns the normal serialized key-ring profile on success.
- Enforce stale-revision rejection inside a single D1 batch using the existing assertion rollback pattern.
- Refetch the latest key-ring profile on update conflicts without automatically retrying the mutation.

**Non-Goals:**

- Add a user-facing DEK rotation flow in this iteration.
- Remove old DEKs from key-ring content or define DEK retention/garbage-collection policy.
- Make key-ring update and sync compaction one atomic operation across endpoints.
- Change password-wrapper replacement semantics or increment key-ring revision for password-only wrapper changes.

## Decisions

### Use `revision` for key-ring concurrency

Add `key_ring.revision`, initialized to `1` on setup and incremented only when the encrypted key-ring payload is replaced. This avoids overloading `encryptionVersion`, which remains the crypto/data-format version.

Alternatives considered:

- Reuse `encryptionVersion`: rejected because it describes ciphertext format compatibility, not mutable state concurrency.
- Use timestamps as validators: rejected because numeric revisions are simpler to compare and deterministic in tests.

### Keep revision in metadata, plaintext, and AAD

The serialized key-ring profile will include `keyRing.revision`. The encrypted plaintext will include the same `revision`, and key-ring AAD will become `autokpo:e2ee-key-ring:v1:{userId}:{activeDekId}:{revision}`.

This gives three layers of protection:

- the server can compare stored metadata for optimistic concurrency;
- AES-GCM authentication fails if ciphertext is replayed under a different active DEK or revision context;
- decrypt validation catches plaintext/metadata mismatch after successful authentication.

### Update with a conditional mutation plus postcondition assertion

`PUT /api/e2ee/key-ring` will accept `currentRevision`, the new public key-ring metadata, IV, and ciphertext. The authoritative write will be a D1 batch:

1. `UPDATE key_ring ... WHERE user_id = ? AND revision = currentRevision`, setting `revision = currentRevision + 1`.
2. Assert that the user's key-ring row now exists with `revision = currentRevision + 1` and submitted `activeDekId`.

If another writer already advanced the revision, the update affects zero rows, the postcondition assertion fails, and D1 rolls back the batch. The endpoint returns `409 { "code": "key_ring_revision_conflict" }`.

The successful response can be produced by reading the latest profile after the batch commits. That read shapes the response; it is not write authority.

### Treat active-DEK changes as a sync write barrier

This endpoint is future-ready for changing `activeDekId`. Once `key_ring.activeDekId` changes, the existing sync push/compact guards reject writes encrypted with the previous active DEK. That is desirable: the key-ring update commits the cutover point for future writes.

Correctness after such a future cutover requires the key-ring plaintext to retain old DEKs as long as existing sync records encrypted with old `encryptionKeyId` values may still be read. Compaction encrypted with the new active DEK can then clean up old rows later, but compaction failure does not make the key-ring update invalid.

### Do not increment key-ring revision for password changes

Changing the master password replaces the active password wrapper only. It does not change key-ring ciphertext, active DEK id, or encrypted key-ring plaintext, so it must not increment `key_ring.revision`.

## Risks / Trade-offs

- Storing revision in both metadata and ciphertext creates two values that can diverge if clients encrypt incorrectly → decrypt validation rejects mismatches and tests should cover invalid plaintext revision/activeDekId.
- A key-ring update can commit before a later compact attempt succeeds → old DEKs must remain in key-ring content until encrypted sync history no longer needs them.
- Post-success response read can theoretically fail after a successful mutation → surface as a request failure while the committed update remains durable; a later refetch recovers the profile.
- Conflict refetch without retry means callers must decide whether their intended mutation still applies → safer than blindly replaying encrypted payload changes on top of a different key-ring state.

## Context

AutoKPO sync data is encrypted client-side with the active DEK from the user's E2EE key ring. The server already stores `activeDekId`, rejects sync writes encrypted with a stale DEK, and keeps older DEKs readable until compacted away. Current sync rows identify only the DEK id; they do not identify the key-ring revision that produced the row, so a client cannot reliably decide whether a decrypt failure means stale key-ring cache or hard corruption.

Compaction is the maintenance point where the client already uploads a full encrypted Y.Doc snapshot and lets the server delete covered update rows. This change makes compaction the trigger for DEK rotation: the client rotates the key ring first, then prepares a compact snapshot with the new active DEK and revision. Rotation and compaction remain independent so a successful rotation is not rolled back by a failed compact request.

## Goals / Non-Goals

**Goals:**

- Rotate the active sync DEK automatically when a compact session starts.
- Keep compact retries idempotent by reusing the same prepared compact request, DEK id, and key-ring revision.
- Add `keyRingRevision` to sync rows and authenticate it in sync payload AAD.
- Require sync uploads to match both current `activeDekId` and current key-ring `revision`.
- Let clients decrypt old rows by looking up each row's `encryptionKeyId` in the unlocked key-ring DEK map.
- Bound key-ring ciphertext size so retained DEKs cannot grow the encrypted key-ring blob without limit.

**Non-Goals:**

- Garbage-collect retired DEKs in this change.
- Add user-visible rotation progress or reporting.
- Change master password wrapper semantics.
- Support legacy sync rows without `keyRingRevision`; the app is not released, so new schema-only behavior is acceptable.

## Decisions

### Compaction starts a compact session that may rotate once

A compact hint starts a compact session. The client determines the compact basis (`replacesUpTo` and max key-ring revision represented by covered rows), then ensures the current key-ring revision is newer than that basis. If not, it rotates the key ring by adding a new DEK, setting it active, and updating the encrypted key ring with revision CAS.

If another client already rotated first, the revision conflict path refetches the latest key ring, abandons the locally generated DEK, and joins the existing newer revision. This avoids back-to-back automatic rotations from concurrent clients.

Alternative considered: always retry the client's generated rotation after a CAS conflict. Rejected because concurrent compaction could create unnecessary revision churn while producing no additional security benefit.

### Rotation and compaction are independent but ordered

The client performs rotation before preparing the compact payload. Once the key-ring update commits, rotation is successful: future server writes require the new active DEK and revision. If the subsequent compact request fails, the client retries compaction with the already-prepared key/revision rather than rotating again.

Alternative considered: make rotation and compaction one atomic server operation. Rejected because the server never sees plaintext key material or Y.Doc data, and tying both operations together would complicate client-side E2EE without improving correctness.

### Compact retries reuse the same prepared request

After rotation, the client freezes the compact request: id, IV, ciphertext, `replacesUpTo`, `encryptionKeyId`, and `keyRingRevision`. Transient/network retries reuse that exact request so timeout/unknown-commit cases remain idempotent with the existing sync idempotency model.

If a retry observes that the prepared revision is no longer current, or the server returns write conflict/stale-cursor behavior, the compact session ends. The client refreshes keys/sync state and starts a new compact session only if compaction is still needed.

Alternative considered: recompute a fresher snapshot on each retry. Rejected because it weakens idempotency after a request may have committed but the response was lost.

### Sync rows carry authenticated key-ring revision

Every sync update and snapshot row stores `keyRingRevision`. Sync encryption AAD changes to include revision:

```text
autokpo:e2ee-update:v1:{userId}:{keyId}:{keyRingRevision}:{blockId}:{kind}
```

The server accepts sync writes only when both `encryptionKeyId` and `keyRingRevision` match the current key-ring row. The client uses row revision for bounded recovery: if a received row's revision is greater than the local key-ring revision, it refetches the key ring once and retries decryption; if the row revision is less than or equal to local revision and decryption still fails, the error is hard rather than another refetch loop.

Alternative considered: keep revision only as unauthenticated metadata. Rejected because metadata substitution could make decrypt/error handling ambiguous.

### Encryption context exposes DEK lookup

The unlocked encryption session exposes the active DEK for writes and a DEK lookup for reads. Pull decryption uses `record.encryptionKeyId` to retrieve the matching DEK. This fulfills the existing requirement that old DEKs remain readable until compacted rows disappear.

Alternative considered: keep exposing only the active DEK. Rejected because rotated clients must still decrypt old rows that remain in the server log.

### Retired DEKs are retained for now

This change does not remove old DEKs from the key ring. A later change can add safe DEK garbage collection after the server can prove no sync row references a retired key. To control abuse/growth, the backend enforces a maximum key-ring ciphertext size on setup/update requests.

Alternative considered: delete old DEKs immediately after compact. Rejected because compact tail retention, stale clients, and failed/partial cleanup can leave readable rows referencing older DEKs.

## Risks / Trade-offs

- **Retained DEKs grow the encrypted key-ring blob** → Backend key-ring ciphertext size validation caps growth; DEK GC is deferred to a separate safe design.
- **Rotation succeeds but compaction fails** → This is acceptable; old rows remain decryptable because old DEKs are retained, and future writes use the new key/revision.
- **Concurrent clients rotate/compact simultaneously** → Revision CAS and “join latest rotation” behavior prevent repeated automatic rotation conflicts.
- **Prepared compact request becomes stale after another rotation** → Server revision validation rejects it; client ends the session, refreshes state, and starts a new session only if still needed.
- **Decrypt failures could otherwise loop forever** → Row `keyRingRevision` bounds recovery to one refetch for future revisions; current-or-older revision failures are surfaced as hard errors.

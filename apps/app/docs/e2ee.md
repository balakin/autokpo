# End-to-end encryption

This document describes AutoKPO's E2EE key hierarchy, key-ring lifecycle, unlock/session behavior, DEK rotation, and password changes.

Sync-specific transport rules live in [`sync.md`](./sync.md). Sync rows use the DEKs described here, but sync sequencing, cursors, compaction, and idempotency are documented separately.

## Glossary

- **MEK**: master encryption key. Random 32-byte key that encrypts the key ring.
- **DEK**: data encryption key. Random 32-byte key used to encrypt sync updates and snapshots.
- **Active DEK**: current DEK used for new sync writes.
- **Historical DEKs**: older DEKs kept in the key ring so old sync rows remain decryptable.
- **Key ring**: encrypted JSON containing `revision`, `activeDekId`, and all DEKs.
- **Key-ring revision**: monotonic integer. It changes when a new active DEK is added.
- **KEK**: key-encryption key derived from a password or PIN and used only to wrap/unwrap the MEK.
- **Wrapper**: encrypted MEK record. Password wrappers are server-side; local-device/PIN wrappers are local.

## Storage model

```mermaid
erDiagram
  USER ||--o| KEY_RING : owns
  USER ||--o{ KEY_RING_WRAPPING : has

  KEY_RING {
    uuid id
    uuid user_id
    uuid active_dek_id
    int revision
    string encryption_algorithm
    int encryption_version
    bytes iv
    bytes ciphertext
  }

  KEY_RING_WRAPPING {
    uuid id
    uuid user_id
    string method
    string status
    string kdf_algorithm
    int kdf_version
    bytes kdf_salt
    string wrapping_algorithm
    int wrapping_version
    bytes wrapping_iv
    bytes ciphertext
  }
```

Rules:

1. The server stores encrypted key-ring bytes and encrypted MEK wrappers only.
2. The server never receives plaintext MEK or DEKs.
3. The active password wrapper is the account recovery/unlock path stored server-side.
4. Local wrappers can unlock the same MEK without asking for the password, but they do not replace the password wrapper.

## Key hierarchy

```mermaid
flowchart TD
  password[Password or PIN] --> kdf[Argon2id KEK derivation]
  kdf --> kek[KEK]
  kek -->|AES-256-GCM unwrap| mek[MEK]
  local[Local device key] -->|AES-GCM unwrap| mek
  mek -->|AES-256-GCM decrypt| ring[Key ring JSON]
  ring --> active[Active DEK]
  ring --> old[Historical DEKs]
  active -->|encrypt new sync rows| writes[Updates and snapshots]
  old -->|decrypt existing sync rows| previous[Older rows]
```

Rules:

1. Password/PIN secrets derive KEKs. KEKs wrap the MEK; they do not encrypt sync data directly.
2. The MEK decrypts the key ring.
3. DEKs encrypt sync rows. See [`sync.md`](./sync.md#sync-row-encryption) for row AAD and sync metadata binding.
4. Rotation adds a DEK and changes the active DEK, but keeps historical DEKs.

## Key-ring envelope

```mermaid
flowchart LR
  subgraph plainRing[Plaintext key ring]
    version[version: 1]
    revision[revision]
    activeDekId[activeDekId]
    deks[deks map]
  end

  version --> json[JSON]
  revision --> json
  activeDekId --> json
  deks --> json
  json --> enc[AES-256-GCM with MEK]
  aad[AAD: e2ee-key-ring user activeDek revision] --> enc
  enc --> stored[Stored key_ring IV and ciphertext]
```

AAD:

```text
autokpo:e2ee-key-ring:v1:${userId}:${activeDekId}:${revision}
```

Rules:

1. Key-ring plaintext must match database metadata: same revision and same active DEK id.
2. `deks` must contain the active DEK id.
3. Every decoded DEK must be 32 bytes.
4. Any mismatch is an unlock/decrypt failure.

## MEK wrapper envelope

```mermaid
flowchart TD
  secret[Password or PIN] --> kdf[Argon2id with wrapper salt]
  kdf --> kek[KEK]
  mek[MEK] --> wrap[AES-256-GCM]
  kek --> wrap
  aad[AAD: e2ee-wrapped-mek user wrapper method] --> wrap
  wrap --> wrapper[MEK wrapper]
```

AAD:

```text
autokpo:e2ee-wrapped-mek:v1:${userId}:${wrapperId}:${method}
```

Rules:

1. Wrappers encrypt the MEK, not DEKs.
2. Wrapper method is part of AAD, so ciphertext cannot be moved between password/PIN/local-device methods.
3. Password and PIN wrappers use Argon2id parameters recorded with the wrapper.
4. Local device key wrappers are stored locally and are device-specific.

## Initial setup

```mermaid
sequenceDiagram
  participant C as Client
  participant E as E2EE API
  participant D as D1
  participant L as Local key cache

  C->>C: Generate MEK and first DEK
  C->>C: Create key ring revision 1
  C->>C: Wrap MEK with password-derived KEK
  C->>E: POST /api/e2ee/key-ring
  E->>D: Insert key_ring revision 1 and active password wrapper
  E-->>C: Serialized key-ring profile
  C->>L: Cache key ring and wrapper metadata
  C->>C: Unlock session with MEK, active DEK, revision 1, DEK map
```

Rules:

1. Setup creates exactly one initial DEK and key-ring revision `1`.
2. Setup fails with `encryption_key_already_exists` if a profile already exists.
3. The unlocked session starts immediately after successful setup.

## Unlock and session lifecycle

```mermaid
flowchart LR
  checking[Checking profile]
  missing[Uninitialized]
  locked[Locked]
  unlocked[Unlocked app]
  error[Gate error]

  checking -->|no key ring| missing
  checking -->|profile exists| locked
  checking -->|cached local wrapper works| unlocked
  checking -->|network or cache failure| error

  missing -->|setup password| unlocked
  locked -->|password or PIN unlock| unlocked
  locked -->|unlock fails| error
  error -->|retry check| checking
  unlocked -->|clear session| locked
```

Unlocked session exposes:

- `mek`
- `activeDek`
- `activeDekId`
- `keyRingRevision`
- full `deks` map
- `getDek(dekId)`
- `refreshKeyRingProfile()`
- `updateKeyRingProfile()`

Rules:

1. Unlock decrypts the MEK first, then decrypts the key ring with the MEK.
2. The DEK map is kept only in unlocked React state.
3. `clearEncryptionSession` clears MEK, active DEK, revision, and DEK map from React state.
4. Remote sync cannot run without an unlocked encryption context.

## Refreshing and rotating key material

```mermaid
flowchart TD
  current[Unlocked keys in memory]
  reason{Why update keys?}
  refresh[Refresh key ring]
  rotate[Rotate key ring]
  updated[Updated unlocked keys]
  cleared[Keys cleared]

  current --> reason
  reason -->|sync row uses future revision| refresh
  reason -->|sync write conflict| refresh
  reason -->|compact needs newer revision| rotate
  refresh -->|decrypt fetched profile with MEK| updated
  rotate -->|new active DEK and revision +1| updated
  current -->|clearEncryptionSession| cleared
```

Rules:

1. Refresh fetches the latest key-ring profile, caches it, decrypts it with the current MEK, and updates unlocked DEK state.
2. Rotation creates a new DEK, appends it to the DEK map, makes it active, and increments revision by one.
3. Rotation submits an optimistic `PUT /api/e2ee/key-ring` guarded by `currentRevision`.
4. If another device wins the revision race, the client refreshes and may use the winner's key ring when it satisfies the caller's revision requirements.

Recovery errors are handled outside the happy-path graph:

- **Refresh fails**: network, profile decrypt, or still-stale revision errors stop the current sync attempt. The Y.Doc is preserved.
- **Rotation conflict**: refresh the key ring and use the winner only when its revision is newer than the compact basis.
- **Rotation fallback is not newer**: fail compaction instead of writing a snapshot with stale key material.

## Change password

Password change rewraps the same MEK. It does not rotate DEKs and does not change key-ring revision.

```mermaid
sequenceDiagram
  participant C as Unlocked client
  participant E as E2EE API
  participant D as D1

  C->>C: Keep current MEK in memory
  C->>C: Derive new KEK from new password and fresh salt
  C->>C: Encrypt MEK into a new password wrapper
  C->>E: POST /api/e2ee/key-ring/change-password
  E->>D: Assert current password wrapper is active
  E->>D: Revoke current password wrapper
  E->>D: Insert new active password wrapper
  E-->>C: 204 No Content
```

Rules:

1. Change password requires an unlocked MEK.
2. The MEK remains the same, so all existing key-ring and sync data remains decryptable.
3. Only the password wrapper changes.
4. The previous password wrapper is revoked atomically with inserting the new wrapper.
5. If the current wrapper is already revoked or missing, the server returns `password_wrapper_conflict`.

## Invariants

- Server never receives plaintext MEK or DEKs.
- Key ring keeps historical DEKs across rotation.
- Key-ring AAD binds user id, active DEK id, and revision.
- MEK wrapper AAD binds user id, wrapper id, and method.
- Password change does not rotate DEKs or change key-ring revision.
- Clear session removes all plaintext key material from React state.

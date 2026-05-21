## Context

The app currently enters the signed-in application after authentication and mounts CRDT-backed state through the signed-in app path. E2EE introduces a separate user-facing boundary: authentication proves account identity, while the encryption password unlocks data for the current auth session.

This change is intentionally UI-focused and minimal. It creates the post-auth shell and screens needed to explain, set up, and unlock encrypted data before the data-backed app is mounted. It does not add configurable unlock strategies or the full encrypted CRDT/sync storage implementation.

## Goals / Non-Goals

**Goals:**

- Add a fullscreen encryption shell between authentication and the main app.
- Provide first-time setup UI for creating an encryption password with explicit non-recovery acknowledgement.
- Provide returning-user unlock UI for entering the encryption password.
- Keep encrypted data unlocked for the current auth session after successful setup/unlock.
- Clear session encryption material when logout/auth cleanup runs, auth is lost, or the local authenticated user changes.
- Preserve access to account context, logout, and global language/theme controls before encrypted data is unlocked.

**Non-Goals:**

- PIN unlock.
- User-configurable “unlock behavior for this session”.
- Security settings tab.
- Password change or destructive encrypted-data reset flows.
- Full encrypted IndexedDB/Yjs persistence or remote E2EE sync protocol.
- Account recovery or cross-device recovery.

## Decisions

### Use a dedicated `EncryptionShell` for setup and unlock

The setup and unlock screens SHALL render in a fullscreen shell instead of inside the main app shell. This mirrors the auth entry experience and avoids showing app navigation before encrypted data is available.

The shell SHALL keep only account-level controls available before unlock: app identity, source/license footer, and a profile trigger that exposes the signed-in account, language selector, theme selector, and logout. On mobile this account surface SHALL use a drawer; on wider screens it SHALL use a popover. Logout remains guarded by online state because the existing auth sign-out flow requires network access.

Alternatives considered:

- **Modal over the app shell**: rejected because it implies the app is already usable and risks mounting data-backed UI before unlock.
- **Settings/onboarding page inside app navigation**: rejected for the same reason and because first setup must happen before normal app usage.

### Place E2EE frontend boundaries in `src/e2ee`

The minimal encryption UI and session boundary SHALL live in a dedicated `apps/app/src/e2ee` module. This module should own E2EE-facing React components and state seams such as the encryption gate, shell, setup screen, unlock screen, forgot-password explanation, and current-session encryption state.

Keeping these files out of `auth` and `crdt` preserves the product distinction between authentication, encryption unlock, and data synchronization. Later cryptographic persistence and encrypted CRDT integration can extend the same module or add submodules without scattering E2EE concepts across unrelated feature folders.

Alternatives considered:

- **Put encryption unlock UI under `auth`**: rejected because the encryption password is not an auth credential and should not be modeled as sign-in.
- **Put encryption unlock UI under `crdt`**: rejected because setup/unlock is a user-facing security boundary, not just a storage implementation detail.
- **Split each screen into existing UI folders**: rejected for MVP because E2EE needs a coherent source boundary for future key/session/storage work.

### Gate CRDT/app mounting behind encryption unlock

The encryption gate SHALL sit after auth and before CRDT/app providers. Setup and unlock screens can use auth identity and global UI controls, but data-backed app providers should not mount until encryption is ready.

Alternatives considered:

- **Mount app and hide content**: rejected because it increases accidental plaintext/data access risk and makes loading/error states harder to reason about.
- **Only encrypt local persistence later without a gate**: rejected because users need to understand and provide the encryption password before encrypted data can be safely initialized.

### Start with one default session behavior

After successful setup or unlock, the app SHALL stay unlocked until logout for that auth session. Logout SHALL clear encryption session material. This keeps MVP UX small while matching the desired session-scoped model.

Auth refreshes that prove the user is signed out, and cross-tab stored-session changes to a different authenticated user, SHALL also clear local unlock material. This avoids carrying a session-storage unlock marker across local account changes.

Alternatives considered:

- **Ask repeatedly during a session**: deferred until specific lock events and UX expectations are defined.
- **PIN and stay-unlocked options**: deferred to avoid shipping a broad security settings surface before the core setup/unlock flow exists.

### Keep recovery messaging informational in MVP

The unlock screen SHALL include a “forgot encryption password” path, but MVP SHALL only explain that the password cannot be recovered. Destructive reset is deferred to avoid introducing irreversible account/data actions without a separate design.

Alternatives considered:

- **Immediate reset from unlock screen**: rejected for MVP because it is high-risk and needs separate confirmation, data deletion, and support semantics.

## Risks / Trade-offs

- **User confusion between sign-in and encryption password** → Mitigate with repeated, concise copy: sign-in identifies the user; encryption password unlocks data and cannot be recovered.
- **MVP lacks password recovery/reset** → Mitigate with honest forgot-password messaging and defer destructive reset to a dedicated change.
- **Session-scoped unlock may feel implicit without settings** → Mitigate by stating on setup/unlock that data is unlocked for the current session and cleared on logout/auth cleanup.
- **UI gate before real crypto can become placeholder-only** → Mitigate by defining explicit provider/gate seams so later crypto storage and sync work can plug into the same boundary without redesigning user flow.

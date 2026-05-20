## 1. Leader and auth foundations

- [x] 1.1 Extract Web Locks leadership into an app-level leader service/provider that exposes `isLeader` and `getIsLeader()`.
- [x] 1.2 Add an auth coordination channel so follower tabs can request leader-owned auth actions and receive leader-published auth state.
- [x] 1.3 Implement `AuthProvider` with `loading`, `signed_out`, and `signed_in` states, `userId`, and mock async session/sign-in/logout actions backed by `localStorage`.

## 2. Auth-gated application shell

- [x] 2.1 Refactor app bootstrap so `LeaderProvider` wraps `AuthProvider`, and signed-out boot renders only the auth entry path.
- [x] 2.2 Split the signed-in app into a lazy-loaded subtree that mounts only when auth state is `signed_in`.
- [x] 2.3 Add mock sign-in and logout UI flows that exercise leader-owned auth transitions across tabs.

## 3. Signed-in CRDT runtime refactor

- [x] 3.1 Replace the module-global CRDT singleton with a signed-in runtime/provider that creates and destroys `Y.Doc`, `IndexeddbPersistence`, and bootstrap state through React lifecycle.
- [x] 3.2 Update sync engine, bus, and CRDT consumers to read leader/runtime context instead of importing a CRDT-owned leader or global `ydoc`.
- [x] 3.3 Change Yjs IndexedDB and sync metadata persistence to user-scoped naming while preserving theme as a device-scoped preference.

## 4. Signed-out cleanup and verification

- [x] 4.1 Add a leader-only cleaner that mounts in `signed_out`, immediately removes all app-owned user data, and repeats periodic hygiene while signed out.
- [x] 4.2 Add or update tests covering auth gating, cross-tab leader/follower auth flow, signed-in runtime lifecycle, and signed-out cleanup behavior.
- [x] 4.3 Verify the signed-out entry path avoids mounting CRDT runtime and that the signed-in flow still hydrates and syncs correctly for the active user.

## MODIFIED Requirements

### Requirement: Remembered local user enables optimistic local boot

The system SHALL persist the last successfully authenticated local user's identity in `localStorage` under the key `autokpo:session` as a JSON object with shape `{ userId: string, email: string, image: string | null }`. The `userId` field SHALL be used as the startup hint for reopening local device state. The session object SHALL NOT be treated as an authentication credential.

On mount the auth provider SHALL also call `refreshSession()` asynchronously to verify the cookie session and update (or clear) the stored session object. This runs after the synchronous startup read — it does not block local state from opening.

If `autokpo:session` is absent but the legacy key `autokpo:remembered-local-user` is present in `localStorage`, the system SHALL migrate automatically on first read: write `{ userId, email: null, image: null }` to `autokpo:session` and remove the legacy key.

#### Scenario: Startup reopens local state from remembered user

- **WHEN** the app starts and `autokpo:session` contains a `userId`
- **THEN** the app reopens the local IndexedDB/Yjs state for that user immediately without waiting for a session fetch

#### Scenario: Stale remembered user cleared on startup verification

- **WHEN** the app starts with a stored session but the cookie session is gone or belongs to a different user
- **THEN** `refreshSession()` resolves with `null`, clears `autokpo:session`, and the app transitions to the signed-out state

#### Scenario: No remembered user starts signed out

- **WHEN** the app starts and `autokpo:session` is absent
- **THEN** the app starts in the signed-out flow and does not open a user-specific local cache

#### Scenario: Legacy key is migrated on first read

- **WHEN** `autokpo:session` is absent but `autokpo:remembered-local-user` exists
- **THEN** the system SHALL write `autokpo:session` with `{ userId, email: null, image: null }` and remove `autokpo:remembered-local-user`

### Requirement: Auth state propagates across tabs via storage events

The auth provider SHALL listen to the `storage` event on `window` and re-read the stored session from `autokpo:session` whenever that key changes. This propagates sign-in and sign-out actions performed in other tabs without requiring a BroadcastChannel auth bus.

#### Scenario: Sign-in in another tab updates auth state

- **WHEN** a different tab writes a session object to `autokpo:session` in localStorage
- **THEN** the current tab's auth state updates to reflect the new user object (`id`, `email`, `image`)

#### Scenario: Sign-out in another tab clears auth state

- **WHEN** a different tab removes `autokpo:session` from localStorage
- **THEN** the current tab's auth state clears its user object (`user = null`)

### Requirement: Logout and auth rejection clear local residue

The system SHALL provide a logout flow that clears the authenticated session and removes local user-specific residue from the device. The same cleanup SHALL run when the app receives an authoritative sync auth rejection (`401 unauthorized` or `409 local_user_mismatch`).

#### Scenario: Explicit logout clears local residue

- **WHEN** the signed-in user chooses the logout action
- **THEN** the app clears the authenticated session
- **AND** removes `autokpo:session` from localStorage
- **AND** removes user-specific sync metadata and Yjs IndexedDB state
- **AND** returns to the signed-out flow

#### Scenario: Auth rejection triggers logout cleanup

- **WHEN** the sync client receives `401 unauthorized` or `409 local_user_mismatch`
- **THEN** the app runs the same logout cleanup flow as explicit logout

### Requirement: AuthContext exposes user identity for offline display

`AuthContext` SHALL expose `user: { id: string, email: string | null, image: string | null } | null`. This value SHALL be read from `autokpo:session` on mount (synchronous) and SHALL be updated after `refreshSession()` completes.

#### Scenario: User identity available immediately on mount

- **WHEN** the app starts with a stored session containing email and image
- **THEN** `useAuth().user` SHALL return cached `id`, `email`, and `image` immediately

#### Scenario: User identity updated after session refresh

- **WHEN** `refreshSession()` completes and returns a session with updated email or image
- **THEN** `useAuth().user` SHALL reflect the updated values

#### Scenario: User is null when no session exists

- **WHEN** no session is stored and `refreshSession()` returns null
- **THEN** `useAuth().user` SHALL be null

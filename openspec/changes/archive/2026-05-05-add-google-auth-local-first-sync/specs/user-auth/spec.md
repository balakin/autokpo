## ADDED Requirements

### Requirement: Google sign-in creates an authenticated app session

The system SHALL provide a Google sign-in flow backed by `better-auth`. A successful sign-in SHALL establish an authenticated session using an HttpOnly cookie on the app domain, and the browser client SHALL use the vanilla `better-auth` client API for sign-in and sign-out actions.

#### Scenario: Signed-out user starts Google sign-in

- **WHEN** a signed-out user chooses the Google sign-in action
- **THEN** the browser starts the `better-auth` Google OAuth flow

#### Scenario: Successful sign-in establishes session

- **WHEN** the Google OAuth flow completes successfully
- **THEN** the worker creates or resumes an authenticated session bound to the user account
- **AND** the browser receives the session through an HttpOnly cookie rather than a JS-readable token

### Requirement: Google OAuth callback handles redirect result

The system SHALL expose a `/auth/callback` route handled by a `SocialAuthCallback` component that completes the OAuth flow after the browser is redirected back from Google. On arrival the component SHALL:

- Show a loading indicator while calling `refreshSession()` to fetch and persist the server session.
- On success redirect to `/dashboard`.
- On error (either an `error` query param present in the URL, or `refreshSession()` returning `null`) display a localized error message with a back-to-sign-in action instead of redirecting.

#### Scenario: Successful OAuth redirect completes sign-in

- **WHEN** Google redirects the browser to `/auth/callback` without an `error` query param and the server session is valid
- **THEN** `refreshSession()` persists the user id and the browser navigates to `/dashboard`

#### Scenario: OAuth error param shows failure screen

- **WHEN** Google redirects to `/auth/callback` with an `error` query param
- **THEN** the component displays a localized failure message with the error code and a back-to-sign-in button without attempting a session fetch

#### Scenario: Missing session after redirect shows failure screen

- **WHEN** the OAuth redirect lands on `/auth/callback` without an error param but `refreshSession()` returns `null`
- **THEN** the component displays a localized failure message and a back-to-sign-in button

### Requirement: Remembered local user enables optimistic local boot

The system SHALL persist the last successfully authenticated local user id in `localStorage` under the key `autokpo:remembered-local-user` and use it only as a startup hint for reopening local device state. The remembered local user id SHALL NOT be treated as an authentication credential.

On mount the auth provider SHALL also call `refreshSession()` asynchronously to verify the cookie session and update (or clear) the remembered user id. This runs after the synchronous startup read — it does not block local state from opening.

#### Scenario: Startup reopens local state from remembered user

- **WHEN** the app starts and a remembered local user id exists in `localStorage`
- **THEN** the app reopens the local IndexedDB/Yjs state for that user immediately without waiting for a session fetch

#### Scenario: Stale remembered user cleared on startup verification

- **WHEN** the app starts with a remembered local user id but the cookie session is gone or belongs to a different user
- **THEN** `refreshSession()` resolves with `null`, clears the remembered local user id, and the app transitions to the signed-out state

#### Scenario: No remembered user starts signed out

- **WHEN** the app starts and no remembered local user id exists in `localStorage`
- **THEN** the app starts in the signed-out flow and does not open a user-specific local cache

### Requirement: Auth state propagates across tabs via storage events

The auth provider SHALL listen to the `storage` event on `window` and re-read the remembered local user id whenever the `autokpo:remembered-local-user` key changes. This propagates sign-in and sign-out actions performed in other tabs without requiring a BroadcastChannel auth bus.

#### Scenario: Sign-in in another tab updates auth state

- **WHEN** a different tab writes a user id to `autokpo:remembered-local-user` in localStorage
- **THEN** the current tab's auth state updates to reflect the new user id

#### Scenario: Sign-out in another tab clears auth state

- **WHEN** a different tab removes `autokpo:remembered-local-user` from localStorage
- **THEN** the current tab's auth state clears its user id

### Requirement: Logout and auth rejection clear local residue

The system SHALL provide a logout flow that clears the authenticated session and removes local user-specific residue from the device. The same cleanup SHALL run when the app receives an authoritative sync auth rejection (`401 unauthorized` or `409 local_user_mismatch`).

#### Scenario: Explicit logout clears local residue

- **WHEN** the signed-in user chooses the logout action
- **THEN** the app clears the authenticated session
- **AND** removes the remembered local user id
- **AND** removes user-specific sync metadata and Yjs IndexedDB state
- **AND** returns to the signed-out flow

#### Scenario: Auth rejection triggers logout cleanup

- **WHEN** the sync client receives `401 unauthorized` or `409 local_user_mismatch`
- **THEN** the app runs the same logout cleanup flow as explicit logout

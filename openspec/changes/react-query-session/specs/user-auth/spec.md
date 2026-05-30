## MODIFIED Requirements

### Requirement: Social auth callback uses `/sign-in/oauth/:provider/callback`

The social auth callback route SHALL be `/sign-in/oauth/:provider/callback`, where `:provider` is the OAuth provider identifier (`google` or `github`). Both `callbackURL` and `errorCallbackURL` in each `signIn.social()` call SHALL point to the provider-specific path (e.g. `/sign-in/oauth/google/callback`).

The system SHALL expose this parameterized route handled by the `SocialAuthCallback` component. On arrival the component SHALL:

- Show a loading indicator while the session query fetches and validates the server session.
- On success redirect to `/dashboard`.
- On failure (either an `error` query param present in the URL, or the session query resolving with no authenticated user) display a provider-aware error heading with a code and a back-to-sign-in action.

The callback state SHALL use a unified `{ status: 'error'; code: string }` shape for all failure cases. When the session query resolves with no authenticated user the component SHALL use the synthetic code `missing_session`.

For the recognized error code `account_not_linked`, the component SHALL display a localized message explaining that an account with that email already exists and directing the user to sign in via email OTP instead (rather than displaying the raw code string).

#### Scenario: Successful OAuth redirect completes sign-in

- **WHEN** the provider redirects the browser to `/sign-in/oauth/:provider/callback` without an `error` query param and the server session is valid
- **THEN** the session query persists the user id and the browser navigates to `/dashboard`

#### Scenario: OAuth error param shows provider-aware failure screen

- **WHEN** the provider redirects to `/sign-in/oauth/:provider/callback` with an `error` query param
- **THEN** the component displays a failure heading that includes the resolved provider display name (e.g. "GitHub prijava nije bila uspešna.")
- **AND** the component displays the error code from the query param
- **AND** the component shows a back-to-sign-in button
- **AND** the session query is NOT fetched

#### Scenario: account_not_linked error shows collision-specific message

- **WHEN** the provider redirects to `/sign-in/oauth/:provider/callback` with `?error=account_not_linked`
- **THEN** the component displays a localized message explaining that an account with that email already exists
- **AND** the component directs the user to sign in with their email code instead
- **AND** the raw error code string is NOT displayed as the primary message

#### Scenario: Missing session after redirect shows provider-aware failure screen with synthetic code

- **WHEN** the OAuth redirect lands on `/sign-in/oauth/:provider/callback` without an error param but the session query resolves with no authenticated user
- **THEN** the component displays a failure heading that includes the resolved provider display name
- **AND** the component displays the code `missing_session`
- **AND** the component shows a back-to-sign-in button

#### Scenario: Unknown provider param falls back to generic failure heading

- **WHEN** the callback route is reached with an unrecognized `:provider` param
- **THEN** the failure heading SHALL use a generic localized string (e.g. "Prijava nije uspela.") rather than a provider name

### Requirement: Remembered local user enables optimistic local boot

The system SHALL persist the last successfully authenticated local user id in `localStorage` under the key `autokpo:session` and use it as a startup hint for reopening local device state. The remembered local user id SHALL NOT be treated as an authentication credential.

On startup the session query SHALL use the stored session as `initialData` and immediately fire a background fetch to verify the cookie session and update (or clear) the stored session. This runs after the synchronous startup read — it does not block local state from opening.

#### Scenario: Startup reopens local state from remembered user

- **WHEN** the app starts and a remembered local user id exists in `localStorage`
- **THEN** the app reopens the local IndexedDB/Yjs state for that user immediately without waiting for a session fetch

#### Scenario: Stale remembered user cleared on startup verification

- **WHEN** the app starts with a remembered local user id but the cookie session is gone or belongs to a different user
- **THEN** the session query background fetch resolves with no user, clears the stored session, and the app transitions to the signed-out state

#### Scenario: No remembered user starts signed out

- **WHEN** the app starts and no remembered local user id exists in `localStorage`
- **THEN** the app starts in the signed-out flow and does not open a user-specific local cache

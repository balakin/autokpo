## MODIFIED Requirements

### Requirement: Social auth callback uses `/sign-in/oauth/:provider/callback`

The social auth callback route SHALL be `/sign-in/oauth/:provider/callback`, where `:provider` is the OAuth provider identifier (`google` or `github`). Both `callbackURL` and `errorCallbackURL` in each `signIn.social()` call SHALL point to the provider-specific path (e.g. `/sign-in/oauth/google/callback`).

The system SHALL expose this parameterized route handled by the `SocialAuthCallback` component. On arrival the component SHALL:

- Show a loading indicator while calling `refreshSession()` to fetch and persist the server session.
- On success redirect to `/dashboard`.
- On failure (either an `error` query param present in the URL, or `refreshSession()` returning `null`) display a provider-aware error heading with a code and a back-to-sign-in action.

The callback state SHALL use a unified `{ status: 'error'; code: string }` shape for all failure cases. When `refreshSession()` returns `null` the component SHALL use the synthetic code `missing_session`.

For the recognized error code `account_not_linked`, the component SHALL display a localized message explaining that an account with that email already exists and directing the user to sign in via email OTP instead (rather than displaying the raw code string).

#### Scenario: Successful OAuth redirect completes sign-in

- **WHEN** the provider redirects the browser to `/sign-in/oauth/:provider/callback` without an `error` query param and the server session is valid
- **THEN** `refreshSession()` persists the user id and the browser navigates to `/dashboard`

#### Scenario: OAuth error param shows provider-aware failure screen

- **WHEN** the provider redirects to `/sign-in/oauth/:provider/callback` with an `error` query param
- **THEN** the component displays a failure heading that includes the resolved provider display name (e.g. "GitHub prijava nije bila uspešna.")
- **AND** the component displays the error code from the query param
- **AND** the component shows a back-to-sign-in button
- **AND** `refreshSession()` is NOT called

#### Scenario: account_not_linked error shows collision-specific message

- **WHEN** the provider redirects to `/sign-in/oauth/:provider/callback` with `?error=account_not_linked`
- **THEN** the component displays a localized message explaining that an account with that email already exists
- **AND** the component directs the user to sign in with their email code instead
- **AND** the raw error code string is NOT displayed as the primary message

#### Scenario: Missing session after redirect shows provider-aware failure screen with synthetic code

- **WHEN** the OAuth redirect lands on `/sign-in/oauth/:provider/callback` without an error param but `refreshSession()` returns `null`
- **THEN** the component displays a failure heading that includes the resolved provider display name
- **AND** the component displays the code `missing_session`
- **AND** the component shows a back-to-sign-in button

#### Scenario: Unknown provider param falls back to generic failure heading

- **WHEN** the callback route is reached with an unrecognized `:provider` param
- **THEN** the failure heading SHALL use a generic localized string (e.g. "Prijava nije uspela.") rather than a provider name

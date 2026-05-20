## ADDED Requirements

### Requirement: GitHub sign-in creates an authenticated app session

The system SHALL provide a GitHub sign-in flow backed by `better-auth`. A successful sign-in SHALL establish an authenticated session using an HttpOnly cookie on the app domain, identical to the existing Google sign-in model. The worker SHALL read `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` from environment bindings.

#### Scenario: Signed-out user starts GitHub sign-in

- **WHEN** a signed-out user chooses the GitHub sign-in action
- **THEN** the browser starts the `better-auth` GitHub OAuth flow

#### Scenario: Successful GitHub sign-in establishes session

- **WHEN** the GitHub OAuth flow completes successfully
- **THEN** the worker creates or resumes an authenticated session bound to the GitHub user account
- **AND** the browser receives the session through an HttpOnly cookie rather than a JS-readable token

#### Scenario: Auth entry shows GitHub sign-in action

- **WHEN** a signed-out user opens `/sign-in`
- **THEN** the screen SHALL display a GitHub sign-in action alongside the existing Google sign-in action

### Requirement: `signIn` context method accepts a provider parameter

The `AuthContext.signIn` method SHALL accept a `provider` parameter of type `'google' | 'github'` and forward it to `signInSession`. Callers MUST supply the provider; the method SHALL NOT default to any provider.

#### Scenario: Google provider triggers Google OAuth flow

- **WHEN** a component calls `signIn('google')`
- **THEN** `signInSession('google')` is called and the browser starts the Google OAuth flow

#### Scenario: GitHub provider triggers GitHub OAuth flow

- **WHEN** a component calls `signIn('github')`
- **THEN** `signInSession('github')` is called and the browser starts the GitHub OAuth flow

## MODIFIED Requirements

### Requirement: Social auth callback uses `/sign-in/oauth/:provider/callback`

The social auth callback route SHALL be `/sign-in/oauth/:provider/callback`, where `:provider` is the OAuth provider identifier (`google` or `github`). Both `callbackURL` and `errorCallbackURL` in each `signIn.social()` call SHALL point to the provider-specific path (e.g. `/sign-in/oauth/google/callback`).

The system SHALL expose this parameterized route handled by the `SocialAuthCallback` component. On arrival the component SHALL:

- Show a loading indicator while calling `refreshSession()` to fetch and persist the server session.
- On success redirect to `/dashboard`.
- On failure (either an `error` query param present in the URL, or `refreshSession()` returning `null`) display a provider-aware error heading with a code and a back-to-sign-in action.

The callback state SHALL use a unified `{ status: 'error'; code: string }` shape for all failure cases. When `refreshSession()` returns `null` the component SHALL use the synthetic code `missing_session`.

#### Scenario: Successful OAuth redirect completes sign-in

- **WHEN** the provider redirects the browser to `/sign-in/oauth/:provider/callback` without an `error` query param and the server session is valid
- **THEN** `refreshSession()` persists the user id and the browser navigates to `/dashboard`

#### Scenario: OAuth error param shows provider-aware failure screen

- **WHEN** the provider redirects to `/sign-in/oauth/:provider/callback` with an `error` query param
- **THEN** the component displays a failure heading that includes the resolved provider display name (e.g. "GitHub prijava nije bila uspešna.")
- **AND** the component displays the error code from the query param
- **AND** the component shows a back-to-sign-in button
- **AND** `refreshSession()` is NOT called

#### Scenario: Missing session after redirect shows provider-aware failure screen with synthetic code

- **WHEN** the OAuth redirect lands on `/sign-in/oauth/:provider/callback` without an error param but `refreshSession()` returns `null`
- **THEN** the component displays a failure heading that includes the resolved provider display name
- **AND** the component displays the code `missing_session`
- **AND** the component shows a back-to-sign-in button

#### Scenario: Unknown provider param falls back to generic failure heading

- **WHEN** the callback route is reached with an unrecognized `:provider` param
- **THEN** the failure heading SHALL use a generic localized string (e.g. "Prijava nije uspela.") rather than a provider name

### Requirement: Auth entry offers Google, GitHub, and email OTP sign-in methods

The system SHALL present Google sign-in, GitHub sign-in, and an email input on the `/sign-in` route. Submitting a valid email address SHALL send an OTP and navigate the user to the `/sign-in/code` route to complete verification.

#### Scenario: Signed-out user sees all auth methods

- **WHEN** a signed-out user opens `/sign-in`
- **THEN** the screen SHALL display a Google sign-in action
- **AND** the screen SHALL display a GitHub sign-in action
- **AND** the screen SHALL display an email input with an action to request a one-time code

#### Scenario: Google sign-in button triggers Google OAuth

- **WHEN** a signed-out user activates the Google sign-in action
- **THEN** `signIn('google')` SHALL be called

#### Scenario: GitHub sign-in button triggers GitHub OAuth

- **WHEN** a signed-out user activates the GitHub sign-in action
- **THEN** `signIn('github')` SHALL be called

#### Scenario: Email submission navigates to code-entry route

- **WHEN** a signed-out user submits a valid email address on `/sign-in`
- **THEN** the system SHALL request an OTP for that email
- **AND** the browser SHALL navigate to `/sign-in/code` where the user enters the received code
- **AND** the submitted email address SHALL be carried to `/sign-in/code` via `AuthEmailProvider` context

#### Scenario: Accessing `/sign-in/code` without a prior email redirects to `/sign-in`

- **WHEN** a user opens `/sign-in/code` without an email address stored in `AuthEmailProvider`
- **THEN** the screen SHALL redirect the user to `/sign-in`

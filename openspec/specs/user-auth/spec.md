## Purpose

Define authentication session behavior, auth callbacks, navigation guards, and signed-in/signed-out route protection.

## Requirements

### Requirement: Google sign-in creates an authenticated app session

The system SHALL provide a Google sign-in flow backed by `better-auth`. A successful sign-in SHALL establish an authenticated session using an HttpOnly cookie on the app domain, and the browser client SHALL use the vanilla `better-auth` client API for sign-in and sign-out actions.

#### Scenario: Signed-out user starts Google sign-in

- **WHEN** a signed-out user chooses the Google sign-in action
- **THEN** the browser starts the `better-auth` Google OAuth flow

#### Scenario: Successful sign-in establishes session

- **WHEN** the Google OAuth flow completes successfully
- **THEN** the worker creates or resumes an authenticated session bound to the user account
- **AND** the browser receives the session through an HttpOnly cookie rather than a JS-readable token

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

### Requirement: Navigation guards protect signed-in and signed-out routes

The route graph SHALL use `SignedInGate` and `SignedOutGate` components to enforce auth state on route groups. The route graph SHALL be created by `createAppRoutes()` and composed into the browser router from `router.tsx`.

- `SignedInGate` SHALL redirect signed-out users to `/sign-in`
- `SignedOutGate` SHALL redirect signed-in users to `/dashboard`
- The signed-out route group (`/sign-in`, `/sign-in/code`, `/goodbye`) SHALL be wrapped in both `SignedOutGate` and `AuthEmailProvider`
- The signed-in application shell SHALL only be loaded after `SignedInGate` determines that `AuthContext.user` is present
- The catch-all route SHALL redirect from stored session state to `/dashboard` when a remembered session exists, or `/sign-in` otherwise

#### Scenario: Signed-out user is redirected before signed-in app loads

- **WHEN** a signed-out user navigates directly to a signed-in route
- **THEN** `SignedInGate` SHALL redirect the user to `/sign-in`
- **AND** the signed-in application shell and signed-in page modules SHALL NOT be rendered to decide or perform the redirect

#### Scenario: Signed-in user enters signed-in app

- **WHEN** a signed-in user navigates to a signed-in route
- **THEN** `SignedInGate` SHALL allow the route group to render
- **AND** the signed-in application shell SHALL load for that authenticated user

#### Scenario: Stored session redirects catch-all route

- **WHEN** a user navigates to an unknown route
- **THEN** the catch-all route SHALL inspect stored session state
- **AND** it SHALL redirect remembered signed-in users to `/dashboard`
- **AND** it SHALL redirect users without a stored session to `/sign-in`

### Requirement: Better Auth direct account deletion is enabled

The worker SHALL enable Better Auth direct user deletion without configuring delete-account verification email. Account deletion SHALL use Better Auth's delete-user flow for the currently signed-in user.

The worker SHALL set `session.freshAge` to `0` to disable the session freshness check on the delete-user endpoint. The app uses email OTP only — there is no password re-entry path that would produce a fresh session, so the built-in freshness guard is not applicable.

#### Scenario: Signed-in deletion uses Better Auth delete user

- **WHEN** the client submits a confirmed account deletion request
- **THEN** the request SHALL use Better Auth's delete-user endpoint for the current session
- **AND** the worker SHALL NOT send a delete-account verification email before deleting the user

#### Scenario: Deleted session becomes signed out

- **WHEN** Better Auth completes direct user deletion
- **THEN** the deleted user's auth session SHALL be cleared
- **AND** the app SHALL observe signed-out state on the next auth refresh or route transition

### Requirement: Auth entry offers Google, GitHub, and email OTP sign-in methods

The system SHALL present Google sign-in, GitHub sign-in, and an email input on the `/sign-in` route. Submitting a valid email address SHALL send an OTP and navigate the user to the `/sign-in/code` route to complete verification.

The `/sign-in` and `/sign-in/code` routes SHALL present these methods inside `AuthShell` — a full-screen page with a gradient/grid background, a header with compact locale and theme selectors, and a centered sign-in card that follows the signed-in app design system. The `/sign-in` page SHALL show Google before GitHub and visually separate OAuth from email OTP with an `or` divider.

#### Scenario: Signed-out user sees all auth methods

- **WHEN** a signed-out user opens `/sign-in`
- **THEN** the screen SHALL display a Google sign-in action
- **AND** the screen SHALL display a GitHub sign-in action after Google
- **AND** the screen SHALL display an email input with an action to request a one-time code
- **AND** the email sign-in section SHALL be visually separated from OAuth actions by an `or` divider

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

#### Scenario: /sign-in/code shows a masked email address

- **WHEN** a user lands on `/sign-in/code` after submitting an email
- **THEN** the page SHALL display a masked version of the email (e.g., `d***@example.com`) rather than the full address

#### Scenario: Accessing `/sign-in/code` without a prior email redirects to `/sign-in`

- **WHEN** a user opens `/sign-in/code` without an email address stored in `AuthEmailProvider`
- **THEN** the screen SHALL redirect the user to `/sign-in`

### Requirement: Email OTP request sends a sign-in code without creating a session

The system SHALL support requesting a sign-in one-time password for an email address through Better Auth's email OTP flow. Requesting a code SHALL trigger worker-side email delivery and SHALL NOT by itself authenticate the browser session. The worker SHALL only send OTP emails for requests with `type: sign-in`; other OTP types SHALL be silently ignored.

Before sending an OTP, the worker SHALL enforce three protective checks in this order:

1. **Captcha validation**: the request SHALL include a valid Cloudflare Turnstile token in the `x-captcha-response` header (when `TURNSTILE_SECRET_KEY` is configured in the environment)
2. **Rate limit**: the request SHALL not exceed the per-IP rate limit on the OTP send endpoint
3. **Blocklist check**: the target email domain SHALL not appear in the disposable email blocklist

If any check fails, the OTP SHALL NOT be sent.

The client SHALL obtain a Turnstile token from the Turnstile widget rendered on the sign-in form and attach it to the OTP send request via the `x-captcha-response` header. The widget SHALL only be rendered when `VITE_TURNSTILE_SITE_KEY` is set in the client environment.

#### Scenario: Requesting a code sends OTP email

- **WHEN** a signed-out user submits an email address to request a sign-in code
- **AND** the Turnstile token is valid (test keys always pass in dev)
- **AND** the IP has not exceeded the rate limit
- **AND** the email domain is not in the disposable email blocklist
- **THEN** the system SHALL invoke the Better Auth email OTP send flow for `type: sign-in`
- **AND** the worker SHALL send the generated code to that email address via Resend

#### Scenario: Requesting a code does not sign the user in

- **WHEN** a signed-out user successfully requests a one-time code
- **THEN** the browser SHALL remain signed out until the code is later verified successfully

#### Scenario: Email send failure surfaces as an error

- **WHEN** the Resend API call fails (non-2xx response)
- **THEN** the worker SHALL throw an error, causing the Better Auth request to fail
- **AND** the client SHALL surface the failure as a toast notification on the email form

#### Scenario: OTP request with invalid Turnstile token is rejected

- **WHEN** a signed-out user submits an OTP request without a valid `x-captcha-response` token
- **THEN** the worker SHALL reject the request before sending any email

#### Scenario: OTP request to disposable email domain is rejected

- **WHEN** a signed-out user submits an email address whose domain is in the disposable email blocklist
- **THEN** the worker SHALL reject the request before sending any email

#### Scenario: OTP request exceeding rate limit is rejected

- **WHEN** an IP address has exceeded the configured OTP send rate limit
- **THEN** the worker SHALL reject subsequent requests before sending any email

### Requirement: Email OTP verification creates the same authenticated session model as Google sign-in

The system SHALL support verifying an email one-time password on `/sign-in/code` to complete authentication. Verification SHALL trigger automatically when the user finishes entering all 6 OTP digits. A successful verification SHALL create the same HttpOnly cookie-backed authenticated session model used by Google sign-in.

If the submitted email address does not already belong to an account, the system SHALL allow the successful email OTP verification to create the account as part of sign-in.

#### Scenario: OTP auto-submits on 6-digit completion

- **WHEN** a user enters the 6th digit of the one-time code
- **THEN** the system SHALL automatically attempt verification without requiring an explicit submit action

#### Scenario: Existing email signs in with valid code

- **WHEN** a user completes a valid 6-digit one-time code for an existing account
- **THEN** the worker SHALL create or resume an authenticated session bound to that account
- **AND** the browser SHALL receive the session through an HttpOnly cookie rather than a JS-readable token

#### Scenario: Unknown email signs up through valid code

- **WHEN** a user completes a valid one-time code for an email address that does not yet have an account
- **THEN** the system SHALL create the user account as part of the email OTP sign-in flow
- **AND** the worker SHALL create an authenticated session for that new account

#### Scenario: Successful email OTP sign-in persists remembered user and enters app

- **WHEN** email OTP verification succeeds and the browser refreshes the session
- **THEN** the client SHALL persist the authenticated user id as the remembered local user id
- **AND** the browser SHALL navigate to `/dashboard`

#### Scenario: Invalid code shows inline error and does not create a session

- **WHEN** a user completes an invalid or expired one-time code
- **THEN** the system SHALL reject the verification attempt
- **AND** the OTP input SHALL display an inline error message
- **AND** the browser SHALL remain on `/sign-in/code` in a signed-out state

### Requirement: Resend code is available after a cooldown

The `/sign-in/code` screen SHALL provide a resend action that re-sends the OTP to the same email address. The resend action SHALL be disabled for 30 seconds after the most recent send to limit request frequency.

#### Scenario: Resend is disabled during cooldown

- **WHEN** a code has been sent within the last 30 seconds
- **THEN** the resend button SHALL be disabled and SHALL display the remaining cooldown seconds

#### Scenario: Resend is available after cooldown expires

- **WHEN** 30 seconds have elapsed since the last send
- **THEN** the resend button SHALL become enabled

#### Scenario: Successful resend resets the cooldown

- **WHEN** the user triggers a resend and the request succeeds
- **THEN** the cooldown timer SHALL restart from 30 seconds
- **AND** the OTP input SHALL be cleared

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

### Requirement: Auth context exposes session identity from `autokpo:session`

The auth runtime SHALL persist a serialized session snapshot in localStorage under the key `autokpo:session`. `AuthContext.user` SHALL be derived from that session snapshot and represent the authenticated identity used by signed-in UI surfaces.

#### Scenario: Session snapshot persists authenticated identity

- **WHEN** authentication state is refreshed with a valid signed-in session
- **THEN** the client SHALL store a serialized session snapshot in `autokpo:session`
- **AND** the snapshot SHALL include the user identity fields required by signed-in UI

#### Scenario: AuthContext.user resolves from cached session snapshot

- **WHEN** the app initializes and a valid `autokpo:session` snapshot exists
- **THEN** `AuthContext.user` SHALL resolve from that snapshot identity

#### Scenario: Clearing session snapshot clears AuthContext.user

- **WHEN** sign-out or auth rejection clears local auth storage
- **THEN** `autokpo:session` SHALL be removed
- **AND** `AuthContext.user` SHALL become `null`

### Requirement: OAuth sign-up initializes app-owned avatar import

The system SHALL treat OAuth provider profile images as account initialization data only. On first OAuth user creation, the worker SHALL preserve the provider image URL in hidden server-only pending avatar state, SHALL expose only app-owned image data to the client, and SHALL NOT configure provider profile data to overwrite local profile images on later sign-ins.

#### Scenario: New OAuth user with provider image starts import

- **WHEN** a new user is created through Google or GitHub OAuth and the provider returns a profile image URL
- **THEN** the created user SHALL have `image` set to null
- **AND** the created user SHALL have `imageStatus` set to `importing`
- **AND** the provider image URL SHALL be stored in a field that is not accepted from client input and not returned in client API or session output

#### Scenario: New OAuth user without provider image is ready

- **WHEN** a new user is created through Google or GitHub OAuth and the provider does not return a profile image URL
- **THEN** the created user SHALL have `image` set to null
- **AND** the created user SHALL have `imageStatus` set to `ready`

#### Scenario: Later OAuth sign-in does not replace local profile image

- **WHEN** an existing OAuth-linked user signs in again after their provider profile image changed
- **THEN** the system SHALL sign in the existing local user through the linked provider account
- **AND** the system SHALL NOT overwrite the local `image` with the provider image URL or a newly imported provider image

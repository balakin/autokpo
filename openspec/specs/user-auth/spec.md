## Purpose

Define authentication session behavior, auth callbacks, navigation guards, and signed-in/signed-out route protection.

## Requirements

### Requirement: Google sign-in creates an authenticated app session

The system SHALL provide a Google sign-in flow backed by `better-auth`. A successful sign-in SHALL establish an authenticated session using an HttpOnly cookie on the app domain, and the browser client SHALL use the vanilla `better-auth` client API for sign-in and sign-out actions.

The Google OAuth flow SHALL request only `openid` and `https://www.googleapis.com/auth/userinfo.email` scopes. The `profile` scope SHALL NOT be requested. Google One Tap (direct ID token submission) SHALL be disabled.

#### Scenario: Signed-out user starts Google sign-in

- **WHEN** a signed-out user chooses the Google sign-in action
- **THEN** the browser starts the `better-auth` Google OAuth flow with minimal scopes (openid + email only)

#### Scenario: Successful sign-in establishes session

- **WHEN** the Google OAuth flow completes successfully
- **THEN** the worker creates or resumes an authenticated session bound to the user account
- **AND** the browser receives the session through an HttpOnly cookie rather than a JS-readable token
- **AND** no OAuth tokens are stored in the database

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

The system SHALL NOT persist authenticated session data in `localStorage` for startup bootstrapping. On startup, the session query SHALL fetch the current session asynchronously via `sessionQueryOptions` (which configures `staleTime: 5 min`, `networkMode: 'offlineFirst'`, `retry: false`). While the session query is pending, auth-dependent route gates SHALL render null (loading) and SHALL NOT decide that the user is signed in or signed out.

When the browser is online, the server session response SHALL be authoritative. When the browser is offline and the service worker has a cached successful session response, the cached response MAY identify the last-known local user for offline local mode. The cached offline session SHALL NOT be treated as proof of current server authorization.

#### Scenario: Startup waits for session resolution

- **WHEN** the app starts without a resolved session query
- **THEN** auth route gates SHALL show a loading state
- **AND** the app SHALL NOT redirect as signed in or signed out until the session query resolves

#### Scenario: Online session response is authoritative

- **WHEN** the app starts or refreshes auth state while the network is available
- **THEN** the app SHALL use the server session response as the current auth state

#### Scenario: Offline cached session enables local mode

- **WHEN** the app starts while offline
- **AND** the service worker returns a previously cached successful session response
- **THEN** the app SHALL treat the cached session user as the local offline user
- **AND** the app SHALL continue to verify the server session when network access returns

#### Scenario: No session response resolves signed out

- **WHEN** the session query resolves with no authenticated user from an online server response
- **THEN** the app SHALL transition to the signed-out state
- **AND** the app SHALL clear local auth and encryption residue required by logout cleanup

### Requirement: Auth state propagates across tabs via storage events

The auth provider SHALL propagate login and logout/session changes across tabs using BroadcastChannel messages rather than `localStorage` storage events. The `SessionSync` component rendered at the app root SHALL subscribe to session-change messages and update or clear the session query in the receiving tab. A tab that receives a session-change message SHALL update or clear its session query and apply the same auth-boundary cleanup rules as the initiating tab.

#### Scenario: Sign-in in another tab updates auth state

- **WHEN** a different tab completes sign-in and broadcasts a session-change message
- **THEN** the current tab SHALL refresh or update its session query to reflect the signed-in user

#### Scenario: Sign-out in another tab clears auth state

- **WHEN** a different tab completes logout and broadcasts a logout/session-change message
- **THEN** the current tab SHALL clear or refresh its session query
- **AND** the current tab SHALL stop using session state from the previous user

### Requirement: Logout and auth-session loss clear local residue

The system SHALL provide an online logout flow (`useAuth.logout()`) that clears the authenticated session, removes local user-specific residue from the device (encryption session material, protected service-worker runtime caches, and all non-session React Query cache entries), and broadcasts the logout to other tabs. The `cleanupSignedOutSession` helper SHALL perform the service-worker cache clearing and local wrapper deletion; `clearQueryCacheOnSignOut` SHALL reset the session query and remove all other cached queries.

Logout SHALL be restricted while offline for this change; the app SHALL NOT pretend that the remote server session was cleared when it cannot complete the logout request.

#### Scenario: Explicit logout clears local residue

- **WHEN** the signed-in user chooses the logout action while online
- **THEN** `useAuth.logout()` SHALL call `authClient.signOut()`, then `cleanupSignedOutSession(userId)`, then `clearQueryCacheOnSignOut(queryClient)`
- **AND** the app clears the authenticated session
- **AND** clears encryption session material for the previous user
- **AND** clears named protected service-worker runtime caches
- **AND** clears all non-session React Query cache entries
- **AND** broadcasts the logout/session change to other tabs
- **AND** returns to the signed-out flow

#### Scenario: Auth refresh loses session

- **WHEN** auth refresh reports no authenticated user from an online server response
- **THEN** the app SHALL clear the resolved authenticated session
- **AND** the session query SHALL be set to null
- **AND** the session change SHALL be broadcast to other tabs

#### Scenario: Resolved session changes to another user

- **WHEN** the app observes the resolved authenticated session change to a different user id
- **THEN** the app SHALL update the authenticated user state
- **AND** the encryption gate SHALL re-mount with the new user id, fetching the appropriate key-ring profile through the user-scoped query

#### Scenario: Offline logout fails without side effects

- **WHEN** the browser is offline
- **AND** the signed-in user chooses the logout action
- **THEN** the `authClient.signOut()` fetch SHALL fail
- **AND** the error SHALL prevent `cleanupSignedOutSession` and `clearQueryCacheOnSignOut` from running
- **AND** the app SHALL NOT complete local logout cleanup as if the remote session was cleared

### Requirement: Navigation guards protect signed-in and signed-out routes

The route graph SHALL use `SignedInGate` and `SignedOutGate` components to enforce auth state on route groups. The route graph SHALL be defined as the `appRoutes` array in `app-routes.tsx` and composed into the browser router by `createRouter()` from `router.tsx`.

- `SignedInGate` SHALL render a loading state while the session query is unresolved, redirect signed-out users to `/sign-in`, and allow signed-in users to continue.
- `SignedOutGate` SHALL render a loading state while the session query is unresolved, redirect signed-in users to `/dashboard`, and allow signed-out users to continue.
- The signed-out route group (`/sign-in`, `/sign-in/code`, `/goodbye`) SHALL be wrapped in both `SignedOutGate` and `AuthEmailProvider`.
- The signed-in application shell SHALL only be loaded after `SignedInGate` determines that the session user is present and the encryption gate determines that encrypted data is ready for the current auth session.
- The catch-all route (`*`) SHALL use `AuthStateRedirect`, which renders null while the session query is pending and redirects to `/dashboard` for signed-in users or `/sign-in` for signed-out users once resolved.

#### Scenario: Signed-out user is redirected before signed-in app loads

- **WHEN** a signed-out user navigates directly to a signed-in route
- **AND** the session query has resolved with no authenticated user
- **THEN** `SignedInGate` SHALL redirect the user to `/sign-in`
- **AND** the signed-in application shell and signed-in page modules SHALL NOT be rendered to decide or perform the redirect

#### Scenario: Auth gates wait while session is unresolved

- **WHEN** a user navigates to an auth-gated route before the session query resolves
- **THEN** the relevant auth gate SHALL render a loading state
- **AND** it SHALL NOT redirect to `/sign-in` or `/dashboard` until the session query resolves

#### Scenario: Signed-in locked user sees encryption gate before app shell

- **WHEN** a signed-in user navigates to a signed-in route
- **AND** encrypted data is not ready for the current auth session
- **THEN** the encryption gate SHALL render setup or unlock UI
- **AND** the signed-in application shell SHALL NOT load until encryption is ready

#### Scenario: Signed-in unlocked user enters signed-in app

- **WHEN** a signed-in user navigates to a signed-in route
- **AND** encrypted data is ready for the current auth session
- **THEN** `SignedInGate` SHALL allow the route group to render
- **AND** the signed-in application shell SHALL load for that authenticated user

#### Scenario: Resolved session redirects catch-all route

- **WHEN** a user navigates to an unknown route
- **AND** the session query has resolved
- **THEN** the catch-all route SHALL redirect signed-in users to `/dashboard`
- **AND** it SHALL redirect signed-out users to `/sign-in`

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

### Requirement: Sign-in page shows Terms and Privacy notice

The `/sign-in` page SHALL display a concise localized notice near the sign-in actions stating that continuing to sign in accepts the Terms of Service and acknowledges the Privacy Policy. The notice SHALL include links to the locale-appropriate public Terms and Privacy documents on `https://autokpo.com`.

The notice SHALL NOT include the Cookies Policy link and SHALL NOT require a checkbox or persist acceptance state in this iteration.

#### Scenario: Signed-out user sees legal notice on sign-in page

- **WHEN** a signed-out user opens `/sign-in`
- **THEN** the sign-in card SHALL display localized text explaining that continuing to sign in accepts the Terms of Service and acknowledges the Privacy Policy
- **AND** the notice SHALL include a Terms of Service link
- **AND** the notice SHALL include a Privacy Policy link
- **AND** the notice SHALL NOT include a Cookies Policy link

#### Scenario: Sign-in legal notice uses active locale links

- **WHEN** the active app locale is changed on the sign-in page
- **THEN** the Terms and Privacy link labels SHALL be translated
- **AND** the Terms and Privacy hrefs SHALL point to the matching localized `https://autokpo.com` legal document routes

#### Scenario: Sign-in does not require explicit legal checkbox

- **WHEN** a signed-out user signs in with Google, GitHub, or email OTP
- **THEN** the auth flow SHALL proceed without requiring a Terms checkbox
- **AND** the app SHALL NOT store a Terms acceptance timestamp or version

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

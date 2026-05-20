## ADDED Requirements

### Requirement: Auth entry offers Google and email OTP sign-in methods

The system SHALL present both Google sign-in and an email input on the `/sign-in` route. Submitting a valid email address SHALL send an OTP and navigate the user to the `/sign-in/code` route to complete verification.

#### Scenario: Signed-out user sees both auth methods

- **WHEN** a signed-out user opens `/sign-in`
- **THEN** the screen SHALL display a Google sign-in action
- **AND** the screen SHALL display an email input with an action to request a one-time code

#### Scenario: Email submission navigates to code-entry route

- **WHEN** a signed-out user submits a valid email address on `/sign-in`
- **THEN** the system SHALL request an OTP for that email
- **AND** the browser SHALL navigate to `/sign-in/code` where the user enters the received code
- **AND** the submitted email address SHALL be carried to `/sign-in/code` via `AuthEmailProvider` context

#### Scenario: Accessing `/sign-in/code` without a prior email redirects to `/sign-in`

- **WHEN** a user opens `/sign-in/code` without an email address stored in `AuthEmailProvider`
- **THEN** the screen SHALL redirect the user to `/sign-in`

### Requirement: Email OTP request sends a sign-in code without creating a session

The system SHALL support requesting a sign-in one-time password for an email address through Better Auth's email OTP flow. Requesting a code SHALL trigger worker-side email delivery and SHALL NOT by itself authenticate the browser session. The worker SHALL only send OTP emails for requests with `type: sign-in`; other OTP types SHALL be silently ignored.

#### Scenario: Requesting a code sends OTP email

- **WHEN** a signed-out user submits an email address to request a sign-in code
- **THEN** the system SHALL invoke the Better Auth email OTP send flow for `type: sign-in`
- **AND** the worker SHALL send the generated code to that email address via Resend

#### Scenario: Requesting a code does not sign the user in

- **WHEN** a signed-out user successfully requests a one-time code
- **THEN** the browser SHALL remain signed out until the code is later verified successfully

#### Scenario: Email send failure surfaces as an error

- **WHEN** the Resend API call fails (non-2xx response)
- **THEN** the worker SHALL throw an error, causing the Better Auth request to fail
- **AND** the client SHALL surface the failure as a toast notification on the email form

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

## MODIFIED Requirements

### Requirement: Navigation guards protect signed-in and signed-out routes

The router SHALL use `SignedInGate` and `SignedOutGate` components to enforce auth state on route groups, replacing the previous `SessionGate` component.

- `SignedInGate` SHALL redirect unsigned-in users to `/sign-in`
- `SignedOutGate` SHALL redirect signed-in users to `/dashboard`
- The signed-out route group (`/sign-in`, `/sign-in/code`) SHALL be wrapped in both `SignedOutGate` and `AuthEmailProvider`

### Requirement: Catch-all route redirects based on remembered user

- **WHEN** a user navigates to an unknown route
- **AND** a remembered local user id is stored in `localStorage`
- **THEN** the router SHALL redirect to `/dashboard`
- **WHEN** no remembered user id exists
- **THEN** the router SHALL redirect to `/sign-in`

### Requirement: Google social auth callback uses `/sign-in/social/callback`

The Google OAuth callback route SHALL be `/sign-in/social/callback`, replacing the previous `/auth/callback` path. Both `callbackURL` and `errorCallbackURL` in the Google sign-in call SHALL point to this route.

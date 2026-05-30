## MODIFIED Requirements

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

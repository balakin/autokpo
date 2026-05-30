## Purpose

Define data minimization rules for social OAuth sign-ins to prevent token leakage and limit personally identifiable information stored in the database.

## Requirements

### Requirement: Social sign-in stores only identity-linking fields in account table

After a social OAuth sign-in or sign-up, the fields `accessToken`, `refreshToken`, `idToken`, `scope`, `accessTokenExpiresAt`, and `refreshTokenExpiresAt` in the `account` table SHALL always be `null`. The columns remain in the schema (better-auth requires them) but SHALL never contain real token values.

#### Scenario: New user signs in via Google

- **WHEN** a new user completes the Google OAuth flow for the first time
- **THEN** an `account` row is created with `providerId = "google"` and a valid `accountId`
- **AND** `accessToken`, `refreshToken`, `idToken`, `scope`, `accessTokenExpiresAt`, `refreshTokenExpiresAt` are all `null`

#### Scenario: Returning user signs in via Google

- **WHEN** a returning user completes the Google OAuth flow
- **THEN** the existing `account` row is NOT updated with new token values
- **AND** token fields remain `null`

#### Scenario: New user signs in via GitHub

- **WHEN** a new user completes the GitHub OAuth flow for the first time
- **THEN** an `account` row is created with `providerId = "github"` and a valid `accountId`
- **AND** `accessToken`, `refreshToken`, `idToken`, `scope`, `accessTokenExpiresAt`, `refreshTokenExpiresAt` are all `null`

### Requirement: Social sign-in does not populate name or image in user table

After a social OAuth sign-in or sign-up, the `user` table row SHALL have `name = ""` and `image = null`. The provider's display name and avatar URL SHALL NOT be stored.

#### Scenario: New user signs in via Google

- **WHEN** a new user completes the Google OAuth flow
- **THEN** the created `user` row has `name = ""` and `image = null`

#### Scenario: New user signs in via GitHub

- **WHEN** a new user completes the GitHub OAuth flow
- **THEN** the created `user` row has `name = ""` and `image = null`

#### Scenario: Returning user signs in via any social provider

- **WHEN** a returning user completes an OAuth flow
- **THEN** the `user` row `name` and `image` fields are NOT updated from provider data

### Requirement: OAuth state is stored in an encrypted cookie, not the verification table

During a social OAuth flow, the OAuth state payload SHALL be stored in an AES-encrypted HttpOnly cookie with a 10-minute TTL. The `verification` table SHALL NOT receive a row for OAuth state during any social sign-in.

#### Scenario: User initiates Google sign-in

- **WHEN** a user clicks "Sign in with Google"
- **THEN** an encrypted `oauth_state` cookie is set on the response
- **AND** no row is written to the `verification` table

#### Scenario: OAuth callback completes

- **WHEN** the provider redirects to the callback route
- **THEN** the state is read and validated from the encrypted cookie
- **AND** the `oauth_state` cookie is expired/cleared

### Requirement: Google OAuth requests minimal scopes

The Google OAuth authorization request SHALL request only `openid` and `email` scopes. The `profile` scope SHALL NOT be requested.

#### Scenario: User initiates Google sign-in

- **WHEN** the system redirects the user to Google's authorization endpoint
- **THEN** the `scope` parameter contains `openid` and the email scope
- **AND** the `scope` parameter does NOT contain `profile`

### Requirement: Google One Tap / direct ID token sign-in is disabled

The system SHALL NOT accept a Google ID token submitted directly by the client (One Tap flow). The `/sign-in/social/google` endpoint SHALL only process standard OAuth authorization code flows.

#### Scenario: Client attempts direct ID token submission

- **WHEN** a client submits a Google ID token directly to the auth endpoint
- **THEN** the request is rejected

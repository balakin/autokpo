## MODIFIED Requirements

### Requirement: Social sign-in stores only identity-linking fields in account table

After a social OAuth sign-in or sign-up, the fields `accessToken`, `refreshToken`, `idToken`, `scope`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, and `password` in the `account` table SHALL always be `null`. The columns remain in the schema (better-auth requires them) but SHALL never contain real token or credential values.

The worker SHALL construct persisted account data from an explicit allowlist of identity-linking fields instead of spreading provider account data into the database hook result. Because OAuth tokens are never persisted, the worker SHALL NOT enable Better Auth OAuth token encryption for these discarded token values.

#### Scenario: New user signs in via Google

- **WHEN** a new user completes the Google OAuth flow for the first time
- **THEN** an `account` row is created with `providerId = "google"` and a valid `accountId`
- **AND** `accessToken`, `refreshToken`, `idToken`, `scope`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, and `password` are all `null`

#### Scenario: Returning user signs in via Google

- **WHEN** a returning user completes the Google OAuth flow
- **THEN** the existing `account` row is NOT updated with new token values
- **AND** token fields remain `null`

#### Scenario: New user signs in via GitHub

- **WHEN** a new user completes the GitHub OAuth flow for the first time
- **THEN** an `account` row is created with `providerId = "github"` and a valid `accountId`
- **AND** `accessToken`, `refreshToken`, `idToken`, `scope`, `accessTokenExpiresAt`, `refreshTokenExpiresAt`, and `password` are all `null`

#### Scenario: Unexpected account fields are not persisted by the hook

- **WHEN** Better Auth provides additional provider account fields during account creation
- **THEN** the account create hook SHALL persist only explicitly allowlisted identity-linking fields and explicit nulls for token or credential fields

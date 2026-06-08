## MODIFIED Requirements

### Requirement: Account export JSON structure

The exported JSON SHALL contain the following top-level fields:

- `exportedAt`: ISO 8601 timestamp string of when the export was generated
- `schemaVersion`: integer version of the export format (currently `2`)
- `account`: object with:
  - `email`: string or null
  - `emailVerified`: boolean
  - `createdAt`: ISO 8601 timestamp string or null
- `providers`: array of objects with:
  - `name`: OAuth provider ID string (e.g. `"github"`, `"google"`)
  - `accountId`: the provider-assigned account ID (e.g. Google `sub`, GitHub numeric user ID)
- `sessions`: array of objects with:
  - `ipAddress`: string or null
  - `userAgent`: string or null
  - `createdAt`: ISO 8601 timestamp string or null
  - `expiresAt`: ISO 8601 timestamp string or null
  - `isCurrent`: boolean — `true` if this is the session used to generate the export

#### Scenario: Exported account contains profile fields

- **WHEN** the export completes successfully
- **THEN** the JSON SHALL include the user's email, emailVerified status, and account creation timestamp
- **AND** the JSON SHALL NOT include `name` or `image` fields

#### Scenario: Providers list reflects linked OAuth accounts with their IDs

- **WHEN** the user has one or more OAuth providers linked
- **THEN** `providers` SHALL be an array of `{ name, id }` objects, one per linked account
- **AND** `id` SHALL be the provider-assigned account identifier stored in the `account` table

#### Scenario: Export degrades gracefully on missing fields

- **WHEN** optional fields (createdAt) are not available from the auth client
- **THEN** those fields SHALL be `null` in the exported JSON
- **AND** the download SHALL still be triggered

#### Scenario: Provider entry is omitted when accountId is not returned

- **WHEN** a linked account entry does not include an `accountId` field
- **THEN** that entry SHALL be excluded from the `providers` array

#### Scenario: Sessions list is included in export

- **WHEN** the export completes successfully
- **THEN** the JSON SHALL include a `sessions` array with one entry per active session
- **AND** each entry SHALL contain `ipAddress`, `userAgent`, `createdAt`, `expiresAt`, and `isCurrent`
- **AND** the session token SHALL NOT appear in any entry

#### Scenario: Current session is flagged in export

- **WHEN** the export is generated
- **THEN** the session used to authenticate the export request SHALL have `isCurrent: true`
- **AND** all other sessions SHALL have `isCurrent: false`

#### Scenario: Session metadata is null when unavailable

- **WHEN** a session entry is missing IP address, user agent, creation time, or expiration time
- **THEN** the corresponding field in the export SHALL be `null`
- **AND** the entry SHALL still appear in the `sessions` array

#### Scenario: schemaVersion is 2

- **WHEN** the export completes successfully
- **THEN** the `schemaVersion` field SHALL be `2`

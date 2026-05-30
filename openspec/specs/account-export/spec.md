## Purpose

Define the behavior for exporting server-side account data as a downloadable JSON file from the account settings page.

## Requirements

### Requirement: User can export account data as JSON

The system SHALL allow a signed-in online user to download their server-side account data as a single JSON file from the account settings page. The export SHALL be assembled client-side using the auth client (no new server endpoint). The file SHALL be named `autokpo-account-YYYY-MM-DD.json` where the date is the local date at export time. The export action SHALL only be available when the user is online; when offline the entire account settings tab renders an offline notice, so no additional disabled state is required.

#### Scenario: Export button triggers download when online

- **WHEN** the user is online and presses "Izvezi podatke naloga" in the account settings page
- **THEN** the browser SHALL download a file named `autokpo-account-<date>.json`
- **AND** the file SHALL be valid JSON

#### Scenario: Export is unavailable offline

- **WHEN** the user is offline
- **THEN** the account settings tab SHALL render the existing offline notice card
- **AND** the account export button SHALL NOT be visible

### Requirement: Account export JSON structure

The exported JSON SHALL contain the following top-level fields:

- `exportedAt`: ISO 8601 timestamp string of when the export was generated
- `schemaVersion`: integer version of the export format (currently `1`)
- `account`: object with:
  - `email`: string or null
  - `emailVerified`: boolean
  - `createdAt`: ISO 8601 timestamp string or null
- `providers`: array of objects with:
  - `name`: OAuth provider ID string (e.g. `"github"`, `"google"`)
  - `accountId`: the provider-assigned account ID (e.g. Google `sub`, GitHub numeric user ID)

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

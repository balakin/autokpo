## MODIFIED Requirements

### Requirement: Sync uploads enforce bounded request and stored ciphertext sizes

The backend SHALL bound sync upload payloads at the request, base64 field, decoded ciphertext, and database row layers. `POST /api/sync/push` and `POST /api/sync/compact` SHALL reject request bodies that exceed the configured sync body limit before JSON parsing. The `ciphertext` base64 string SHALL be rejected before decoding when it is too long to fit the configured sync ciphertext byte limit. The database SHALL reject `sync_record.ciphertext` rows whose byte length exceeds the same sync ciphertext byte limit.

#### Scenario: Oversized sync push body is rejected before JSON parsing

- **WHEN** an authenticated sync push request body exceeds the configured sync body limit
- **THEN** the backend SHALL reject the request with HTTP 413 before parsing the body as JSON
- **AND** the backend SHALL NOT insert a sync row

#### Scenario: Oversized sync compact body is rejected before JSON parsing

- **WHEN** an authenticated sync compact request body exceeds the configured sync body limit
- **THEN** the backend SHALL reject the request with HTTP 413 before parsing the body as JSON
- **AND** the backend SHALL NOT insert a snapshot row or delete covered rows

#### Scenario: Oversized sync ciphertext string is rejected before base64 decode

- **WHEN** an authenticated sync push or compact request contains a `ciphertext` base64 string that cannot decode within the configured sync ciphertext byte limit
- **THEN** the backend SHALL reject the request as too large or invalid before decoding that field
- **AND** the backend SHALL NOT insert a sync row

#### Scenario: Sync ciphertext database constraint rejects oversized rows

- **WHEN** code attempts to persist a `sync_record` row whose `ciphertext` byte length exceeds the configured sync ciphertext byte limit
- **THEN** the database SHALL reject the write

## ADDED Requirements

### Requirement: Key-ring endpoints enforce bounded request and stored blob sizes

The backend SHALL bound key-ring and password-wrapper payloads at the request, base64 field, decoded byte, and database row layers. Key-ring mutation endpoints under `/api/e2ee/*` SHALL reject request bodies that exceed the configured E2EE body limit before JSON parsing. Base64 fields with known decoded limits SHALL be rejected before decoding when they are too long to fit those limits. The database SHALL reject key-ring and wrapper rows whose encrypted blob sizes do not satisfy the shared size constants.

#### Scenario: Oversized key-ring setup body is rejected before JSON parsing

- **WHEN** an authenticated `POST /api/e2ee/key-ring` request body exceeds the configured E2EE body limit
- **THEN** the backend SHALL reject the request with HTTP 413 before parsing the body as JSON
- **AND** the backend SHALL NOT create key-ring or wrapper rows

#### Scenario: Oversized key-ring update body is rejected before JSON parsing

- **WHEN** an authenticated `PUT /api/e2ee/key-ring` request body exceeds the configured E2EE body limit
- **THEN** the backend SHALL reject the request with HTTP 413 before parsing the body as JSON
- **AND** the backend SHALL NOT update the key-ring row

#### Scenario: Oversized password change body is rejected before JSON parsing

- **WHEN** an authenticated `POST /api/e2ee/key-ring/change-password` request body exceeds the configured E2EE body limit
- **THEN** the backend SHALL reject the request with HTTP 413 before parsing the body as JSON
- **AND** the backend SHALL NOT revoke or insert password wrapper rows

#### Scenario: Oversized key-ring ciphertext string is rejected before base64 decode

- **WHEN** a key-ring setup or update request contains a key-ring `ciphertext` base64 string that cannot decode within the configured key-ring ciphertext byte limit
- **THEN** the backend SHALL reject the request as invalid before decoding that field
- **AND** the backend SHALL NOT persist the submitted ciphertext

#### Scenario: Oversized wrapper fields are rejected before base64 decode

- **WHEN** a key-ring setup or password change request contains `kdfSalt` or wrapped MEK `ciphertext` base64 strings that cannot decode to their configured fixed byte lengths
- **THEN** the backend SHALL reject the request as invalid before decoding those fields
- **AND** the backend SHALL NOT persist the submitted wrapper

#### Scenario: Key-ring database constraints reject oversized encrypted blobs

- **WHEN** code attempts to persist a `key_ring` row whose `ciphertext` byte length exceeds the configured key-ring ciphertext byte limit
- **THEN** the database SHALL reject the write

#### Scenario: Wrapper database constraints reject incorrect fixed-size blobs

- **WHEN** code attempts to persist a `key_ring_wrapping` row whose `kdf_salt` or `ciphertext` byte length does not equal the configured fixed byte length for that field
- **THEN** the database SHALL reject the write

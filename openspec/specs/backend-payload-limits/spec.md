# backend-payload-limits Specification

## Purpose

Define shared encrypted payload size constants and pre-parse body limits for non-auth encrypted JSON endpoints, ensuring oversized request bodies are rejected before JSON parsing or base64 decoding.

## Requirements

### Requirement: Non-auth encrypted JSON endpoints enforce pre-parse body limits

The Worker SHALL reject oversized request bodies for non-auth encrypted JSON endpoints before JSON parsing or base64 decoding. The limit for `/api/e2ee/*` SHALL be sized for key-ring and wrapper metadata. The limit for `/api/sync` and `/api/sync/*` SHALL be sized for one encrypted sync payload with base64 and JSON overhead. Requests rejected by these limits SHALL receive HTTP 413.

#### Scenario: Oversized key-ring body is rejected before parsing

- **WHEN** an authenticated request to `POST /api/e2ee/key-ring`, `PUT /api/e2ee/key-ring`, or `POST /api/e2ee/key-ring/change-password` exceeds the configured E2EE body limit
- **THEN** the Worker SHALL reject the request with HTTP 413
- **AND** the key-ring route handler SHALL NOT parse the body as JSON

#### Scenario: Oversized sync body is rejected before parsing

- **WHEN** an authenticated request to `POST /api/sync` or `POST /api/sync/compact` exceeds the configured sync body limit
- **THEN** the Worker SHALL reject the request with HTTP 413
- **AND** the sync route handler SHALL NOT parse the body as JSON

#### Scenario: Non-body endpoints are unaffected

- **WHEN** a request is made to a non-auth endpoint that does not accept a JSON request body, such as `GET /api/sync`, `GET /api/e2ee/key-ring`, or the exchange-rate proxy endpoints
- **THEN** the endpoint SHALL preserve its existing request handling behavior

### Requirement: Encrypted payload limits use shared constants

The Worker SHALL define shared encrypted payload size constants used by non-auth route validation and custom encrypted D1 schema constraints. The sync ciphertext maximum, key-ring ciphertext maximum, KDF salt byte length, and wrapped MEK ciphertext byte length SHALL have a single source of truth within Worker code.

#### Scenario: Route and schema use the same sync ciphertext maximum

- **WHEN** the sync route validates decoded ciphertext size
- **THEN** it SHALL use the same sync ciphertext maximum as the `sync_record.ciphertext` database size constraint

#### Scenario: Route and schema use the same key-ring blob sizes

- **WHEN** the E2EE routes validate key-ring ciphertext, KDF salt, or wrapped MEK ciphertext sizes
- **THEN** they SHALL use the same constants as the corresponding key-ring database size constraints

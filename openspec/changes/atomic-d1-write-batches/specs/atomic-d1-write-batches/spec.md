## ADDED Requirements

### Requirement: D1 write batches use database assertions for rollback

Backend write paths that require multiple dependent D1 mutations SHALL use D1 batch execution as the transaction boundary and SHALL convert failed required postconditions into database errors so the batch rolls back.

#### Scenario: Assertion failure rolls back a batch

- **WHEN** a batched backend write detects that a required postcondition is false inside the batch
- **THEN** the backend SHALL trigger a database constraint failure using the shared assertion mechanism
- **AND** D1 SHALL rollback all previous statements in that batch
- **AND** the endpoint SHALL NOT persist a partial mutation

#### Scenario: Assertion table is generic infrastructure

- **WHEN** the schema defines the assertion mechanism
- **THEN** it SHALL use a Drizzle-managed `tx_assert` table with an `ok` column constrained so only successful assertion values are valid
- **AND** the table SHALL NOT store domain data or endpoint-specific state

### Requirement: Backend write endpoints preserve existing public semantics

Migrating backend write endpoints to atomic batches SHALL preserve existing request shapes, response success shapes, and public error code meanings.

#### Scenario: Batch conflict maps to existing errors

- **WHEN** a batched write fails because a concurrency precondition is stale
- **THEN** the endpoint SHALL return the existing conflict or mismatch error code for that operation
- **AND** the endpoint MAY perform diagnostic reads after the failed batch to choose the existing public error code
- **AND** diagnostic reads SHALL NOT be used as write authority

### Requirement: Raw SQL is limited to assertion expressions

Backend write migrations SHALL prefer Drizzle schema definitions and query builders. Raw SQL SHALL be limited to assertion expressions or SQL constructs that cannot be represented clearly with the Drizzle builder API.

#### Scenario: Raw assertions reference Drizzle schema objects

- **WHEN** an assertion statement requires raw SQL
- **THEN** the statement SHALL reference Drizzle schema tables and fields where practical instead of hard-coded table or column names

# cloudflare-kv-session-storage Specification

## Purpose

Defines how better-auth sessions and verification records are stored in the application backend. Sessions are stored in D1 via the Drizzle adapter; no Cloudflare KV namespace is used for authentication storage.

## Requirements

### Requirement: Sessions are stored in D1

The system SHALL store better-auth sessions in the D1 database via the Drizzle adapter. The worker SHALL NOT configure `secondaryStorage` in the better-auth options. A `session` table SHALL exist in the D1 schema with columns matching better-auth's expected session model (`id`, `expiresAt`, `token`, `createdAt`, `updatedAt`, `ipAddress`, `userAgent`, `userId`). There SHALL be no `AUTH_KV` KV namespace binding in the worker configuration.

#### Scenario: Session lookup uses D1

- **WHEN** an authenticated request arrives and `getSession()` is called
- **THEN** the session SHALL be retrieved from the D1 `session` table
- **AND** no KV namespace SHALL be queried

#### Scenario: Session creation uses D1

- **WHEN** a user signs in and better-auth creates a new session
- **THEN** the session record SHALL be written to the D1 `session` table
- **AND** no KV write SHALL occur

#### Scenario: OTP verification record uses D1

- **WHEN** the email OTP plugin writes or reads a verification record
- **THEN** the record SHALL be stored in the D1 `verification` table
- **AND** no KV write SHALL occur

## Removed

### Requirement: KV namespace is isolated between environments

**Reason**: The `AUTH_KV` KV namespace is removed entirely. Sessions are now stored in D1, which already has per-environment database bindings (`autokpo-dev` and `autokpo-production`).
**Migration**: No migration needed. Remove `kv_namespaces` entries from `wrangler.jsonc` for both base and `env.production` environments.

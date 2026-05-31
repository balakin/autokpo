# cloudflare-kv-session-storage Specification

## Purpose

TBD - created by archiving change cloudflare-kv. Update Purpose after archive.

## Requirements

### Requirement: Sessions and verification records are stored in Cloudflare KV

The system SHALL configure better-auth with a `secondaryStorage` backed by a Cloudflare KV namespace (`AUTH_KV`). Sessions and OTP verification records SHALL be written to and read from KV rather than D1.

#### Scenario: Session lookup uses KV

- **WHEN** an authenticated request arrives and `getSession()` is called
- **THEN** the session SHALL be retrieved from the `AUTH_KV` KV namespace
- **AND** no D1 query SHALL be issued for session lookup

#### Scenario: OTP verification record uses KV

- **WHEN** the email OTP plugin writes or reads a verification record
- **THEN** the record SHALL be stored in the `AUTH_KV` KV namespace with a TTL matching the OTP expiry
- **AND** no D1 query SHALL be issued for the verification record

### Requirement: KV namespace is isolated between environments

The worker SHALL use a separate KV namespace for local development and production. The `AUTH_KV` binding SHALL resolve to the dev namespace in the default (local) wrangler environment and to the production namespace under `env.production`.

#### Scenario: Local dev uses dev namespace

- **WHEN** the worker runs in local development
- **THEN** session data SHALL be written to and read from the dev `AUTH_KV` namespace

#### Scenario: Production uses production namespace

- **WHEN** the worker runs in the production environment
- **THEN** session data SHALL be written to and read from the production `AUTH_KV` namespace

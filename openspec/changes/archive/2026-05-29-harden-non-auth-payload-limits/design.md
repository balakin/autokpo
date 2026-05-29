## Context

The non-auth Worker endpoints that accept encrypted JSON payloads are `/api/sync`, `/api/sync/compact`, and `/api/e2ee/key-ring*`. Their handlers validate decoded ciphertext sizes before database writes, but the current flow parses JSON first and then decodes base64 strings before enforcing those decoded-byte limits. Cloudflare Workers allow request bodies far larger than these endpoint payloads require, so relying only on platform limits leaves avoidable memory and CPU exposure.

The custom encrypted D1 tables also rely on route validation for blob sizes. Adding database size constraints for those tables provides a final integrity boundary and keeps persisted encrypted blobs aligned with the same limits enforced by the routes.

## Goals / Non-Goals

**Goals:**

- Reject oversized non-auth JSON request bodies before `c.req.json()` runs.
- Reject oversized base64 fields before decoding when their maximum decoded size is known.
- Share a single source of truth for encrypted blob size constants across routes and schema definitions.
- Add size-only D1 constraints for custom encrypted tables.
- Preserve existing endpoint contracts for valid payloads.

**Non-Goals:**

- Changing `/api/auth/*` request handling or Better Auth configuration.
- Changing encryption formats, algorithms, AAD strings, or key-rotation behavior.
- Adding D1 constraints for Better Auth-managed tables.
- Replacing existing per-user sync storage cap logic with database triggers.

## Decisions

### Use endpoint-family body limits before route handlers

Use Hono's built-in `bodyLimit` middleware for the non-auth encrypted JSON surfaces. Apply a smaller limit to `/api/e2ee/*` and a larger limit to both `/api/sync` and `/api/sync/*` so sync push and compact can carry the existing 1 MiB ciphertext allowance plus base64 and JSON overhead.

Alternatives considered:

- Manual `Content-Length` checks only: faster to add, but incomplete when the header is absent or inaccurate.
- A single global `/api/*` body limit: simpler, but auth and sync have different payload budgets and auth is explicitly out of scope.

### Add base64 string maximums before decode

Keep the decoded-byte checks as the authority, but cap known base64 string fields before `Uint8Array.fromBase64(...)`. This avoids decoding strings that cannot possibly satisfy the decoded-byte limits.

Alternatives considered:

- Only body limits: sufficient for gross abuse, but still allows a full bounded body to be spent on one impossible field.
- Only decoded-byte checks: already present, but they happen after decode allocation.

### Share size constants from a worker limits module

Move the existing size constants used by sync and E2EE validation into a shared Worker module so route validators and database schemas use the same values. Names should describe the domain, for example sync ciphertext max, key-ring ciphertext max, KDF salt bytes, and wrapped MEK ciphertext bytes.

Alternatives considered:

- Duplicate numeric constants in schema files: less refactoring, but drift-prone.
- Import schema constants from route files: creates undesirable route-to-schema coupling and mixes HTTP concerns with data invariants.

### Add size-only D1 constraints for custom encrypted tables

Add row-level constraints for encrypted blob sizes:

- `sync_record.ciphertext` length is less than or equal to the sync ciphertext maximum.
- `key_ring.ciphertext` length is less than or equal to the key-ring ciphertext maximum.
- `key_ring_wrapping.kdf_salt` length equals the KDF salt byte length.
- `key_ring_wrapping.ciphertext` length equals the wrapped MEK ciphertext byte length.

Do not add this change's database constraints to Better Auth tables, and do not attempt to enforce the per-user sync total cap in D1 constraints because that invariant spans rows.

Alternatives considered:

- No DB constraints: route validation remains the only boundary and can drift.
- Broader crypto constraints for algorithms and JSON metadata: useful later, but outside the requested size-only scope.

## Risks / Trade-offs

- Existing local or test databases might contain rows that violate the new constraints → The app already enforces these limits on normal writes; migration risk should be low, and tests should cover expected valid payloads.
- Body limits could be too small for legitimate sync payloads near the existing ciphertext maximum → Use a sync body budget that accounts for base64 expansion and JSON envelope overhead, and include a boundary-style test for valid large payload shape if practical.
- Hono route matching could miss bare `/api/sync` if only `/api/sync/*` is limited → Register limits so both `/api/sync` and `/api/sync/*` are covered.
- D1 migration syntax for `CHECK` constraints may require table recreation rather than `ALTER TABLE ADD CHECK` → Generate and review the migration produced by the existing Drizzle workflow, then adjust manually only if necessary.

## Migration Plan

1. Add the shared constants module and route/body/string validation changes.
2. Add Drizzle schema constraints using those constants.
3. Generate a D1 migration and apply it locally.
4. Run focused worker tests, then the package build/test checks.
5. Deploy by applying the remote D1 migration before the Worker deploy.

Rollback strategy: revert the schema and route changes in code. If the migration recreates constrained tables, rollback requires a follow-up migration that recreates the tables without the new checks; because the constraints match existing accepted writes, rollback is expected to be unnecessary unless a limit value is discovered to be too strict.

## Open Questions

- Final body-limit byte values should be confirmed during implementation, but the intended budgets are approximately 128 KiB for `/api/e2ee/*` and 2 MiB for `/api/sync` plus `/api/sync/*`.

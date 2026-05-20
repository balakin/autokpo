## MODIFIED Requirements

### Requirement: `updates` table schema

The system SHALL define a single table `updates` with the following columns:

- `user_id` TEXT, NOT NULL, referencing `user.id` with `ON DELETE CASCADE`
- `seq` INTEGER, NOT NULL, monotonically increasing per `user_id` (assigned by the server, not auto-incremented)
- `blob` BLOB, NOT NULL — opaque payload (Yjs update bytes; opaque to the server)
- `kind` TEXT, NOT NULL, one of `'update'` or `'snapshot'`
- `idempotency_key` TEXT, nullable — unique per user, used for deduplicating retries
- `created` INTEGER, NOT NULL, DEFAULT `CURRENT_TIMESTAMP`

The primary key SHALL be the composite `(user_id, seq)`. A unique index SHALL exist on `(user_id, idempotency_key)`. Deleting an auth user SHALL cascade-delete that user's `updates` rows.

The worker SHALL derive `user_id` for every sync query from the authenticated session user id rather than from a hard-coded prototype value.

#### Scenario: Schema present after first migration

- **WHEN** migrations are applied to a fresh D1
- **THEN** the `updates` table exists with the columns, primary key, foreign key, cascade behavior, and unique index listed above

#### Scenario: Sync rows are partitioned by authenticated user

- **WHEN** two different authenticated users perform sync operations
- **THEN** their update rows are stored and queried under different `user_id` values derived from the worker session

#### Scenario: Deleting user cascades sync rows

- **WHEN** an auth user with existing `updates` rows is deleted
- **THEN** D1 SHALL remove that user's `updates` rows through the foreign key cascade

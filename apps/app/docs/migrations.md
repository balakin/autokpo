# D1 migration safety

Deploys are automated: when a release publishes `@autokpo/app`, the Release workflow calls the Deploy App workflow, whose deploy job runs `d1 migrations apply DB --remote` against the **production** database (`CLOUDFLARE_ENV=production`, `autokpo-database`) **before** `wrangler deploy` ships the new worker. Because migrations run automatically ahead of the deploy, every migration must be safe to apply this way.

## The invariant

> At the instant a migration applies, the **currently-live (old) worker** must tolerate the new schema.

The worker and the database are deployed by two separate, non-atomic steps. We migrate first, so during the window between "migration applied" and "new worker live", the **old** code is what's running against the **new** schema. Only ship migrations the old worker can survive. This is the expand/contract discipline: never change a column in a single release in a way the running code can't handle — split it across releases.

## Safe / unsafe classification

| Migration                                 | Auto-safe on release? | Why                                                             |
| ----------------------------------------- | --------------------- | --------------------------------------------------------------- |
| `CREATE TABLE`, `CREATE INDEX`            | ✅ Yes                | Old worker ignores what it doesn't know                         |
| `ADD COLUMN` (nullable or with `DEFAULT`) | ✅ Yes                | Old worker never selects it; new worker does                    |
| Additive backfill `UPDATE`                | ✅ Usually            | Idempotent, no schema break                                     |
| `DROP INDEX`                              | ✅ Usually            | Safe unless a query depends on it for correctness               |
| `ADD COLUMN NOT NULL` without `DEFAULT`   | ⚠️ Risky              | Fails if rows exist; SQLite restriction                         |
| Add `UNIQUE` over existing data           | ⚠️ Risky              | Aborts mid-apply if duplicates exist                            |
| Narrowing a type / `CHECK` over old data  | ⚠️ Risky              | May abort partway; no clean auto-rollback of a partial batch    |
| `RENAME COLUMN` / `RENAME TABLE`          | ❌ Breaks             | Old worker (live during the window) queries the old name → 500s |
| `DROP COLUMN` / `DROP TABLE`              | ❌ Breaks             | Still-running old code references it                            |

## Edge-case recipes

### Rename a column (`image` → `avatar_url`) — three releases

1. **Expand.** Add `avatar_url` (nullable) to the Drizzle schema _alongside_ `image` so `db:generate` emits a pure `ADD COLUMN` (no rename prompt). Hand-add a backfill to the generated migration:
   ```sql
   UPDATE user SET avatar_url = image WHERE avatar_url IS NULL;
   ```
   Ship worker code that reads `avatar_url ?? image` and **writes both** columns.
2. **Stop using old.** No migration. Ship code that reads/writes **only** `avatar_url` and references `image` nowhere. Keep `image` in the schema so Drizzle doesn't drop it yet.
3. **Contract.** Remove `image` from the schema; `db:generate` emits `DROP COLUMN image`. The live worker (release 2) no longer touches it. Safe.

> Never answer **y** to drizzle-kit's `Is image column renamed to avatar_url?` prompt — that emits the unsafe one-shot `RENAME COLUMN`. Expand/contract sidesteps the prompt entirely: only ever a pure add, then later a pure drop.

### Drop a column or table — two releases

1. Ship code that stops referencing the column/table.
2. After that worker is live, ship the `DROP COLUMN` / `DROP TABLE` migration. Confirm the column is not part of any index or constraint first, or the drop aborts mid-batch.

### Add a NOT NULL column — expand then tighten

1. `ADD COLUMN ...` nullable (or with a `DEFAULT`); backfill; ship code that always writes it.
2. Once all rows are populated and the live worker always writes the column, add the `NOT NULL` constraint (a table rebuild under SQLite) in a later migration.

### Add a UNIQUE constraint — clean data first

1. Ship a backfill/dedup migration plus code that stops creating duplicates.
2. After the data is clean, add the unique index. Adding it over dirty data aborts the migration.

### Type narrowing / new CHECK

Treat like UNIQUE: ensure existing rows already satisfy the constraint (backfill in an earlier release) before applying it.

## If something goes wrong

- `wrangler rollback` reverts the **worker**, not the schema. Because every migration above is backward-compatible, a worker rollback is always safe; only the contract (drop) step is irreversible, and by then nothing references the dropped object.
- D1 **Time Travel** is the backstop for a bad or partially-applied migration (point-in-time restore of the database).

import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

// Generic rollback primitive for D1 batches. Assertion statements insert 0 only
// when a required condition is false; the CHECK constraint aborts the batch.
export const txAssert = sqliteTable(
  'tx_assert',
  {
    ok: integer('ok').notNull(),
  },
  (table) => [check('tx_assert_ok_check', sql`${table.ok} = 1`)],
);

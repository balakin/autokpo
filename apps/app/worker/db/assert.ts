import type { SQL } from 'drizzle-orm';
import { exists, sql } from 'drizzle-orm';

import { txAssert } from './schema';

import type { getDb } from '.';

type WorkerDb = ReturnType<typeof getDb>;

export function assertCondition(db: WorkerDb, condition: SQL) {
  return db.insert(txAssert).select(sql`select 0 where not (${condition})`);
}

export function assertExists(
  db: WorkerDb,
  build: (q: ReturnType<WorkerDb['select']>) => Parameters<typeof exists>[0],
) {
  return assertCondition(db, exists(build(db.select({ one: sql`1` }))));
}

import type { InferSelectModel } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  customType,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import { user } from './auth';

// D1 returns blobs as ArrayBuffer; Buffer is unavailable in workerd.
const blobBytes = customType<{ data: Uint8Array; driverData: ArrayBuffer }>({
  dataType: () => 'blob',
  fromDriver: (v) => new Uint8Array(v),
  toDriver: (v) => v.buffer as ArrayBuffer,
});

export const updates = sqliteTable(
  'updates',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    seq: integer('seq').notNull(),
    blob: blobBytes('blob').notNull(),
    kind: text('kind', { enum: ['update', 'snapshot'] }).notNull(),
    idempotencyKey: text('idempotency_key'),
    created: integer('created')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.seq] }),
    uniqueIndex('updates_user_id_idempotency_key_idx').on(
      table.userId,
      table.idempotencyKey,
    ),
  ],
);

export type UpdateRow = InferSelectModel<typeof updates>;

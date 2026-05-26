import type { InferSelectModel } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  customType,
  integer,
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

export const syncRecord = sqliteTable(
  'sync_record',
  {
    id: text('id').primaryKey().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    seq: integer('seq').notNull(),
    encryptionAlgorithm: text('encryption_algorithm').notNull(),
    encryptionVersion: integer('encryption_version').notNull(),
    iv: blobBytes('iv').notNull(),
    ciphertext: blobBytes('ciphertext').notNull(),
    kind: text('kind', { enum: ['update', 'snapshot'] }).notNull(),
    encryptionKeyId: text('encryption_key_id').notNull(),
    created: integer('created', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('sync_record_user_id_seq_idx').on(table.userId, table.seq),
  ],
);

export type SyncRecordRow = InferSelectModel<typeof syncRecord>;

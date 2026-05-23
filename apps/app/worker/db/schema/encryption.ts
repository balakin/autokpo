import type { InferSelectModel } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  customType,
  index,
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

export const keyRing = sqliteTable(
  'key_ring',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    activeDekId: text('active_dek_id').notNull(),
    encryptionVersion: integer('encryption_version').notNull(),
    encryptionAlgorithm: text('encryption_algorithm').notNull(),
    iv: blobBytes('iv').notNull(),
    ciphertext: blobBytes('ciphertext').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [uniqueIndex('key_ring_user_id_idx').on(table.userId)],
);

export const keyRingWrapping = sqliteTable(
  'key_ring_wrapping',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    method: text('method', { enum: ['password'] }).notNull(),
    status: text('status', { enum: ['active', 'revoked'] }).notNull(),
    kdfVersion: integer('kdf_version').notNull(),
    kdfAlgorithm: text('kdf_algorithm').notNull(),
    kdfParamsJson: text('kdf_params_json').notNull(),
    kdfSalt: blobBytes('kdf_salt').notNull(),
    wrappingVersion: integer('wrapping_version').notNull(),
    wrappingAlgorithm: text('wrapping_algorithm').notNull(),
    wrappingParamsJson: text('wrapping_params_json').notNull(),
    wrappingIv: blobBytes('wrapping_iv').notNull(),
    ciphertext: blobBytes('ciphertext').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    uniqueIndex('key_ring_wrapping_active_user_method_unique')
      .on(table.userId, table.method)
      .where(sql`${table.status} = 'active'`),
    index('key_ring_wrapping_user_id_idx').on(table.userId),
  ],
);

export type KeyRingRow = InferSelectModel<typeof keyRing>;
export type KeyRingWrappingRow = InferSelectModel<typeof keyRingWrapping>;

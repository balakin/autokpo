import type { InferSelectModel } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  customType,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

import { user } from './auth';

// D1 returns blobs as ArrayBuffer; Buffer is unavailable in workerd.
const blobBytes = customType<{ data: Uint8Array; driverData: ArrayBuffer }>({
  dataType: () => 'blob',
  fromDriver: (v) => new Uint8Array(v),
  toDriver: (v) => v.buffer as ArrayBuffer,
});

export const userEncryptionKey = sqliteTable(
  'user_encryption_key',
  {
    id: text('key_id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
  },
  (table) => [index('user_encryption_key_user_id_idx').on(table.userId)],
);

export const userEncryptionKeyWrapping = sqliteTable(
  'user_encryption_key_wrapping',
  {
    id: text('wrapping_id').primaryKey(),
    keyId: text('key_id')
      .notNull()
      .references(() => userEncryptionKey.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    method: text('method', { enum: ['password'] }).notNull(),
    kdfVersion: integer('kdf_version').notNull(),
    kdfAlgorithm: text('kdf_algorithm').notNull(),
    kdfParamsJson: text('kdf_params_json').notNull(),
    kdfSalt: blobBytes('kdf_salt').notNull(),
    wrapVersion: integer('wrap_version').notNull(),
    wrapAlgorithm: text('wrap_algorithm').notNull(),
    wrapParamsJson: text('wrap_params_json').notNull(),
    wrapIv: blobBytes('wrap_iv').notNull(),
    wrappedMasterKey: blobBytes('wrapped_master_key').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('user_encryption_key_wrapping_key_id_idx').on(table.keyId),
    index('user_encryption_key_wrapping_user_id_idx').on(table.userId),
  ],
);

export type UserEncryptionKeyRow = InferSelectModel<typeof userEncryptionKey>;
export type UserEncryptionKeyWrappingRow = InferSelectModel<
  typeof userEncryptionKeyWrapping
>;

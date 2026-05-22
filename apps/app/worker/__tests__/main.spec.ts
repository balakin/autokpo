import { afterEach, describe, expect, it } from 'vitest';

import {
  getAuthHeaders,
  clearAuthData,
  workerTestEnv,
} from '../../tests/worker/auth-helpers';
import { getDb } from '../db';
import { userEncryptionKey } from '../db/schema';
import app from '../main';

describe('worker', () => {
  afterEach(async () => {
    await workerTestEnv.DB.exec('DELETE FROM sync_record');
    await workerTestEnv.DB.exec('DELETE FROM user_encryption_key');
    await clearAuthData();
  });

  it('unknown route returns 404', async () => {
    const res = await app.request('/api/unknown');
    expect(res.status).toBe(404);
  });

  it('cascade deletes sync_record when a user is deleted', async () => {
    const userId = 'user-delete-cascade';
    await getAuthHeaders(userId);

    const db = getDb(workerTestEnv.DB);
    const keyId = 'cascade-test-key';
    await db
      .insert(userEncryptionKey)
      .values({ id: keyId, userId })
      .onConflictDoNothing();
    await workerTestEnv.DB.prepare(
      'INSERT INTO sync_record (id, user_id, seq, encryption_algorithm, encryption_version, iv, ciphertext, kind, encryption_key_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        crypto.randomUUID(),
        userId,
        1,
        'aes-256-gcm',
        1,
        new Uint8Array(12).buffer,
        new Uint8Array([1]).buffer,
        'update',
        keyId,
      )
      .run();

    const before = await workerTestEnv.DB.prepare(
      'SELECT COUNT(*) as count FROM sync_record WHERE user_id = ?',
    )
      .bind(userId)
      .first<{ count: number }>();
    expect(before?.count).toBe(1);

    await workerTestEnv.DB.prepare('DELETE FROM user WHERE id = ?')
      .bind(userId)
      .run();

    const after = await workerTestEnv.DB.prepare(
      'SELECT COUNT(*) as count FROM sync_record WHERE user_id = ?',
    )
      .bind(userId)
      .first<{ count: number }>();
    expect(after?.count).toBe(0);
  });
});

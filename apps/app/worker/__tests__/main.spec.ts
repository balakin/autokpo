import { afterEach, describe, expect, it } from 'vitest';

import {
  getAuthHeaders,
  clearAuthData,
  workerTestEnv,
} from '../../tests/worker/auth-helpers';
import app from '../main';

describe('worker', () => {
  afterEach(async () => {
    await workerTestEnv.DB.exec('DELETE FROM updates');
    await clearAuthData();
  });

  it('unknown route returns 404', async () => {
    const res = await app.request('/api/unknown');
    expect(res.status).toBe(404);
  });

  it('cascade deletes updates when a user is deleted', async () => {
    const userId = 'user-delete-cascade';
    await getAuthHeaders(userId);

    await workerTestEnv.DB.prepare(
      'INSERT INTO updates (user_id, seq, blob, kind) VALUES (?, ?, ?, ?)',
    )
      .bind(userId, 1, new Uint8Array([1]).buffer, 'update')
      .run();

    const before = await workerTestEnv.DB.prepare(
      'SELECT COUNT(*) as count FROM updates WHERE user_id = ?',
    )
      .bind(userId)
      .first<{ count: number }>();
    expect(before?.count).toBe(1);

    await workerTestEnv.DB.prepare('DELETE FROM user WHERE id = ?')
      .bind(userId)
      .run();

    const after = await workerTestEnv.DB.prepare(
      'SELECT COUNT(*) as count FROM updates WHERE user_id = ?',
    )
      .bind(userId)
      .first<{ count: number }>();
    expect(after?.count).toBe(0);
  });
});

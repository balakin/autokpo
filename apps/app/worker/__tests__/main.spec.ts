import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  exchangeRatesRateLimitMock,
  getAuthHeaders,
  clearAuthData,
  syncRateLimitMock,
  authRateLimitMock,
  workerTestEnv,
} from '../../tests/worker/auth-helpers';
import { mockCtx } from '../../tests/worker/request-helpers';
import { getDb } from '../db';
import { keyRing } from '../db/schema';
import app from '../main';

describe('worker', () => {
  afterEach(async () => {
    await workerTestEnv.DB.exec('DELETE FROM sync_record');
    await workerTestEnv.DB.exec('DELETE FROM key_ring_wrapping');
    await workerTestEnv.DB.exec('DELETE FROM key_ring');
    await clearAuthData();
    vi.unstubAllGlobals();
  });

  it('unknown route returns 404', async () => {
    const res = await app.request('/api/unknown');
    expect(res.status).toBe(404);
  });

  it('allows under-limit authenticated non-auth API requests', async () => {
    vi.stubGlobal('caches', {
      default: {
        match: vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify({ currencies: [] }))),
        put: vi.fn(),
      },
    });
    const headers = await getAuthHeaders('rate-limit-allowed-user');

    const res = await app.request(
      '/api/exchange-rates/currencies',
      { headers },
      workerTestEnv,
      mockCtx,
    );

    expect(res.status).toBe(200);
    expect(exchangeRatesRateLimitMock).toHaveBeenCalledWith({
      key: 'user:rate-limit-allowed-user:exchange-rates',
    });
  });

  it('returns 429 before route logic when non-auth API rate limit is exceeded', async () => {
    exchangeRatesRateLimitMock.mockResolvedValueOnce({ success: false });
    vi.stubGlobal('fetch', vi.fn());
    const headers = await getAuthHeaders('rate-limit-blocked-user');

    const res = await app.request(
      '/api/exchange-rates/currencies',
      { headers },
      workerTestEnv,
      mockCtx,
    );

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ code: 'rate_limited' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses separate non-auth API rate-limit keys for users sharing an IP', async () => {
    vi.stubGlobal('caches', {
      default: {
        match: vi
          .fn()
          .mockResolvedValue(new Response(JSON.stringify({ currencies: [] }))),
        put: vi.fn(),
      },
    });
    const firstHeaders = await getAuthHeaders('shared-ip-user-1');
    firstHeaders.set('cf-connecting-ip', '203.0.113.10');
    const secondHeaders = await getAuthHeaders('shared-ip-user-2');
    secondHeaders.set('cf-connecting-ip', '203.0.113.10');

    await app.request(
      '/api/exchange-rates/currencies',
      { headers: firstHeaders },
      workerTestEnv,
      mockCtx,
    );
    await app.request(
      '/api/exchange-rates/currencies',
      { headers: secondHeaders },
      workerTestEnv,
      mockCtx,
    );

    expect(exchangeRatesRateLimitMock).toHaveBeenNthCalledWith(1, {
      key: 'user:shared-ip-user-1:exchange-rates',
    });
    expect(exchangeRatesRateLimitMock).toHaveBeenNthCalledWith(2, {
      key: 'user:shared-ip-user-2:exchange-rates',
    });
  });

  it('applies the auth rate limiter to Better Auth routes', async () => {
    const headers = await getAuthHeaders('auth-rate-limit-user');
    headers.set('cf-connecting-ip', '198.51.100.1');

    const res = await app.request(
      '/api/auth/get-session',
      { headers },
      workerTestEnv,
      mockCtx,
    );

    expect(res.status).not.toBe(429);
    expect(authRateLimitMock).toHaveBeenCalledWith({
      key: 'auth:198.51.100.1:/api/auth/get-session',
    });
    expect(syncRateLimitMock).not.toHaveBeenCalled();
    expect(exchangeRatesRateLimitMock).not.toHaveBeenCalled();
  });

  it('returns 429 when auth rate limit is exceeded', async () => {
    authRateLimitMock.mockResolvedValueOnce({ success: false });
    const headers = await getAuthHeaders('auth-rate-limit-blocked');
    headers.set('cf-connecting-ip', '198.51.100.2');

    const res = await app.request(
      '/api/auth/get-session',
      { headers },
      workerTestEnv,
      mockCtx,
    );

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ code: 'rate_limited' });
  });

  it('cascade deletes sync_record when a user is deleted', async () => {
    const userId = 'user-delete-cascade';
    await getAuthHeaders(userId);

    const db = getDb(workerTestEnv.DB);
    const keyId = 'cascade-test-key';
    await db
      .insert(keyRing)
      .values({
        id: keyId,
        userId,
        activeDekId: 'dek-1',
        encryptionAlgorithm: 'aes-256-gcm',
        encryptionParams: JSON.stringify({
          iv: 'AAAAAAAAAAAAAAAA',
          tagBits: 128,
        }),
        ciphertext: new Uint8Array(16),
      })
      .onConflictDoNothing();
    await workerTestEnv.DB.prepare(
      'INSERT INTO sync_record (id, user_id, seq, encryption_algorithm, encryption_params, key_ring_revision, ciphertext, kind, encryption_key_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        crypto.randomUUID(),
        userId,
        1,
        'aes-256-gcm',
        JSON.stringify({ iv: 'AAAAAAAAAAAAAAAA', tagBits: 128 }),
        1,
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

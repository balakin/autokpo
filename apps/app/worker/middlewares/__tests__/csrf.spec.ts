import { afterEach, describe, expect, it } from 'vitest';

import {
  TEST_APP_URL,
  clearAuthData,
  getAuthHeaders,
  workerTestEnv,
} from '../../../tests/worker/auth-helpers';
import { mockCtx } from '../../../tests/worker/request-helpers';
import app from '../../app/app';

async function post(headers: HeadersInit) {
  return app.request(
    '/api/sync',
    { method: 'POST', headers },
    workerTestEnv,
    mockCtx,
  );
}

async function cookieHeaders(userId: string): Promise<Headers> {
  return getAuthHeaders(userId);
}

afterEach(async () => {
  await clearAuthData();
});

describe('CSRF middleware — safe methods', () => {
  it('GET with cookies is not blocked', async () => {
    const headers = await cookieHeaders('csrf-user-get');
    const res = await app.request(
      '/api/sync',
      { method: 'GET', headers },
      workerTestEnv,
      mockCtx,
    );
    expect(res.status).not.toBe(403);
  });

  it('HEAD with cookies is not blocked', async () => {
    const headers = await cookieHeaders('csrf-user-head');
    const res = await app.request(
      '/api/sync',
      { method: 'HEAD', headers },
      workerTestEnv,
      mockCtx,
    );
    expect(res.status).not.toBe(403);
  });
});

describe('CSRF middleware — no cookies', () => {
  it('POST without cookies is not blocked', async () => {
    const res = await post({});
    expect(res.status).not.toBe(403);
  });

  it('POST without cookies and wrong Origin is not blocked', async () => {
    const res = await post({ Origin: 'https://evil.example.com' });
    expect(res.status).not.toBe(403);
  });
});

describe('CSRF middleware — cookie-bearing mutations', () => {
  it('POST with cookies and no Origin returns 403 missing_origin', async () => {
    const headers = await cookieHeaders('csrf-user-1');
    const res = await post(headers);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'missing_origin' });
  });

  it('POST with cookies and Origin: null returns 403 missing_origin', async () => {
    const headers = await cookieHeaders('csrf-user-2');
    headers.set('Origin', 'null');
    const res = await post(headers);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'missing_origin' });
  });

  it('POST with cookies and wrong Origin returns 403 invalid_origin', async () => {
    const headers = await cookieHeaders('csrf-user-3');
    headers.set('Origin', 'https://evil.example.com');
    const res = await post(headers);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'invalid_origin' });
  });

  it('POST with cookies and correct Origin passes through', async () => {
    const headers = await cookieHeaders('csrf-user-4');
    headers.set('Origin', TEST_APP_URL);
    const res = await post(headers);
    expect(res.status).not.toBe(403);
  });

  it('POST with cookies and correct Referer passes through when Origin is absent', async () => {
    const headers = await cookieHeaders('csrf-user-5');
    headers.set('Referer', `${TEST_APP_URL}/some/page`);
    const res = await post(headers);
    expect(res.status).not.toBe(403);
  });

  it('POST with cookies and wrong Referer returns 403 invalid_origin', async () => {
    const headers = await cookieHeaders('csrf-user-6');
    headers.set('Referer', 'https://evil.example.com/page');
    const res = await post(headers);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: 'invalid_origin' });
  });
});

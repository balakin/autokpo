import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  authRateLimitMock,
  clearAuthData,
  createAuthAccount,
  db,
  getAuthHeaders,
  workerTestEnv,
} from '../../../tests/worker/auth-helpers';
import { flushWaitUntil, mockCtx } from '../../../tests/worker/request-helpers';
import app from '../../app/app';
import { MAX_AUTH_BODY_BYTES } from '../../constants';
import { account } from '../../db/schema/auth';

const CAPTCHA_TEST_TOKEN = 'test-captcha-token';

const TURNSTILE_SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function captchaFetchMock(
  fallback: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  return (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url === TURNSTILE_SITEVERIFY_URL) {
      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );
    }
    return fallback(input, init);
  };
}

async function authRequest(path: string, init?: RequestInit) {
  const request = new Request(`http://localhost${path}`, init);
  return app.request(request, undefined, workerTestEnv, mockCtx);
}

async function otpSendRequest(email: string) {
  return authRequest('/api/auth/email-otp/send-verification-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'cf-connecting-ip': '203.0.113.10',
      'x-captcha-response': CAPTCHA_TEST_TOKEN,
    },
    body: JSON.stringify({ email, type: 'sign-in' }),
  });
}

async function captureOtp(email: string, userAgent?: string): Promise<string> {
  let otp: string | null = null;
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
    captchaFetchMock((_input, init) => {
      const body = JSON.parse(
        typeof init?.body === 'string' ? init.body : '{}',
      ) as { text?: string; html?: string };
      const match = (body.text ?? body.html ?? '').match(/\b(\d{6})\b/);
      otp = match?.[1] ?? null;
      return Promise.resolve(new Response('{}', { status: 200 }));
    }),
  );

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'cf-connecting-ip': '203.0.113.10',
      'x-captcha-response': CAPTCHA_TEST_TOKEN,
    };
    if (userAgent) headers['User-Agent'] = userAgent;

    const res = await authRequest('/api/auth/email-otp/send-verification-otp', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, type: 'sign-in' }),
    });
    await flushWaitUntil();
    expect(res.status).toBe(200);
  } finally {
    fetchSpy.mockRestore();
  }

  expect(otp).toBeTruthy();
  return otp ?? '';
}

type AuthSessionPayload = {
  user?: {
    id?: string;
  };
  session?: {
    userId?: string;
    userAgent?: string | null;
    ipAddress?: string | null;
  };
};

describe('email otp auth', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await clearAuthData();
  });

  it('sends an otp email for sign-in requests', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        captchaFetchMock(() =>
          Promise.resolve(new Response('{}', { status: 200 })),
        ),
      );

    try {
      const res = await otpSendRequest('otp@example.com');
      await flushWaitUntil();

      expect(res.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({ method: 'POST' }),
      );
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('creates cookie session after successful verification', async () => {
    const otp = await captureOtp('otp-session@example.com');

    const signInRes = await authRequest('/api/auth/sign-in/email-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '203.0.113.10',
      },
      body: JSON.stringify({
        email: 'otp-session@example.com',
        otp,
      }),
    });
    expect(signInRes.status).toBe(200);

    const cookie = signInRes.headers.get('set-cookie');
    expect(cookie).toContain('HttpOnly');

    const sessionRes = await authRequest('/api/auth/get-session', {
      method: 'GET',
      headers: { Cookie: cookie ?? '' },
    });
    expect(sessionRes.status).toBe(200);

    const sessionPayload: AuthSessionPayload = await sessionRes.json();
    expect(sessionPayload.user?.id).toBeTruthy();
    expect(sessionPayload.session?.userId).toBe(sessionPayload.user?.id);
  });

  it('sends a localized account-deleted email after direct deletion', async () => {
    const authHeaders = await getAuthHeaders('delete-email-user');
    const headers = new Headers(authHeaders);
    headers.set('Content-Type', 'application/json');
    headers.set('Origin', 'http://localhost:5173');
    headers.set('X-Preferred-Locale', 'en');

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    try {
      const res = await authRequest('/api/auth/delete-user', {
        method: 'POST',
        headers,
        body: JSON.stringify({ callbackURL: '/goodbye' }),
      });
      await flushWaitUntil();

      expect(res.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({ method: 'POST' }),
      );
      const call = fetchSpy.mock.calls[0];
      expect(call).toBeDefined();
      const init = call?.[1];
      if (typeof init?.body !== 'string') {
        throw new Error('Expected Resend request body to be a string.');
      }
      const body = JSON.parse(init.body) as {
        subject?: string;
        to?: string[];
        html?: string;
        text?: string;
      };
      expect(body.subject).toBe('Your AutoKPO account has been deleted');
      expect(body.to).toEqual(['delete-email-user@example.com']);
      expect(`${body.html ?? ''}${body.text ?? ''}`).toContain(
        'synchronized data associated with this email address',
      );
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('falls back to the source locale for unsupported account-deleted locale headers', async () => {
    const authHeaders = await getAuthHeaders('delete-locale-user');
    const headers = new Headers(authHeaders);
    headers.set('Content-Type', 'application/json');
    headers.set('Origin', 'http://localhost:5173');
    headers.set('X-Preferred-Locale', 'not-supported'.repeat(10));

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    try {
      const res = await authRequest('/api/auth/delete-user', {
        method: 'POST',
        headers,
        body: JSON.stringify({ callbackURL: '/goodbye' }),
      });
      await flushWaitUntil();

      expect(res.status).toBe(200);
      const init = fetchSpy.mock.calls[0]?.[1];
      if (typeof init?.body !== 'string') {
        throw new Error('Expected Resend request body to be a string.');
      }
      const body = JSON.parse(init.body) as { subject?: string };
      expect(body.subject).toBe('Vaš AutoKPO nalog je obrisan');
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('returns 413 before Better Auth when auth body exceeds limit', async () => {
    const res = await authRequest('/api/auth/sign-in/email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `${'a'.repeat(MAX_AUTH_BODY_BYTES)}@x.test`,
      }),
    });

    expect(res.status).toBe(413);
    await expect(res.json()).resolves.toEqual({ code: 'payload_too_large' });
  });

  it('rejects oversized auth emails before OTP side effects', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        captchaFetchMock(() =>
          Promise.resolve(new Response('{}', { status: 200 })),
        ),
      );

    try {
      const res = await otpSendRequest(`${'a'.repeat(245)}@example.com`);

      expect(res.status).toBe(400);
      expect(fetchSpy).not.toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.anything(),
      );
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('allows required auth endpoints to reach Better Auth', async () => {
    const authHeaders = await getAuthHeaders('allowlist-user');
    const cookie = authHeaders.get('cookie') ?? '';

    const checks: Array<[string, RequestInit, number]> = [
      [
        '/api/auth/get-session',
        { method: 'GET', headers: { Cookie: cookie } },
        200,
      ],
      ['/api/auth/callback/google', { method: 'GET' }, 302],
      ['/api/auth/callback/github', { method: 'GET' }, 302],
      ['/api/auth/sign-out', { method: 'POST' }, 200],
      ['/api/auth/delete-user', { method: 'POST' }, 400],
      [
        '/api/auth/list-sessions',
        { method: 'GET', headers: { Cookie: cookie } },
        200,
      ],
      ['/api/auth/revoke-session', { method: 'POST' }, 400],
      ['/api/auth/revoke-other-sessions', { method: 'POST' }, 401],
      [
        '/api/auth/list-accounts',
        { method: 'GET', headers: { Cookie: cookie } },
        200,
      ],
    ];

    for (const [path, init, blockedStatus] of checks) {
      const res = await authRequest(path, init);
      expect(res.status, path).toBe(blockedStatus);
    }
  });

  it('hides representative unused Better Auth endpoints', async () => {
    const paths = [
      '/api/auth/sign-in/email',
      '/api/auth/update-user',
      '/api/auth/link-social',
      '/api/auth/email-otp/reset-password',
      '/api/auth/revoke-sessions',
    ];

    for (const path of paths) {
      const res = await authRequest(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      expect(res.status, path).toBe(404);
      expect(await res.text()).toBe('Not Found');
    }
  });

  it('applies the auth rate limiter to OTP send endpoint', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        captchaFetchMock(() =>
          Promise.resolve(new Response('{}', { status: 200 })),
        ),
      );

    try {
      const res = await authRequest(
        '/api/auth/email-otp/send-verification-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'cf-connecting-ip': '203.0.113.99',
            'x-captcha-response': CAPTCHA_TEST_TOKEN,
          },
          body: JSON.stringify({
            email: `rate-otp@example.com`,
            type: 'sign-in',
          }),
        },
      );

      // The auth rate limiter passes under normal load
      expect(res.status).toBe(200);
      expect(authRateLimitMock).toHaveBeenCalledWith({
        key: 'auth:203.0.113.99:/api/auth/email-otp/send-verification-otp',
      });
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('does not persist oversized user agent raw and bounds IP metadata', async () => {
    const longUserAgent = `Browser/${'x'.repeat(2000)}`;
    const otp = await captureOtp('metadata@example.com', longUserAgent);

    const signInRes = await authRequest('/api/auth/sign-in/email-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '203.0.113.42',
        'User-Agent': longUserAgent,
      },
      body: JSON.stringify({ email: 'metadata@example.com', otp }),
    });

    expect(signInRes.status).toBe(200);
    const cookie = signInRes.headers.get('set-cookie') ?? '';
    const sessionRes = await authRequest('/api/auth/get-session', {
      headers: { Cookie: cookie },
    });
    expect(sessionRes.status).toBe(200);
    const sessionPayload: AuthSessionPayload = await sessionRes.json();
    expect(sessionPayload.session?.userAgent).not.toBe(longUserAgent);
    expect(sessionPayload.session?.userAgent).toHaveLength(1024);
    expect(sessionPayload.session?.ipAddress?.length ?? 0).toBeLessThanOrEqual(
      128,
    );
  });

  it('account hook persists only identity fields and null token values', async () => {
    const authHeaders = await getAuthHeaders('account-hook-user');
    const cookie = authHeaders.get('cookie') ?? '';

    const res = await authRequest('/api/auth/list-accounts', {
      method: 'GET',
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);

    await createAuthAccount({
      id: 'oauth-account-row',
      accountId: 'provider-account-id',
      providerId: 'google',
      userId: 'account-hook-user',
      accessToken: 'provider-access-token',
      refreshToken: 'provider-refresh-token',
      idToken: 'provider-id-token',
      scope: 'openid email profile',
      accessTokenExpiresAt: new Date(Date.now() + 60_000),
      refreshTokenExpiresAt: new Date(Date.now() + 120_000),
      password: 'should-not-persist',
    });

    const [row] = await db
      .select()
      .from(account)
      .where(eq(account.id, 'oauth-account-row'));

    expect(row).toMatchObject({
      providerId: 'google',
      accountId: 'provider-account-id',
      userId: 'account-hook-user',
      accessToken: null,
      refreshToken: null,
      idToken: null,
      scope: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      password: null,
    });
  });
});

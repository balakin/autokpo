import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearAuthData,
  getAuthHeaders,
  workerTestEnv,
} from '../../tests/worker/auth-helpers';
import { flushWaitUntil, mockCtx } from '../../tests/worker/request-helpers';
import app from '../main';

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
      'x-captcha-response': CAPTCHA_TEST_TOKEN,
    },
    body: JSON.stringify({ email, type: 'sign-in' }),
  });
}

type AuthSessionPayload = {
  user?: {
    id?: string;
  };
  session?: {
    userId?: string;
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
      await otpSendRequest('otp-session@example.com');
      await flushWaitUntil();
    } finally {
      fetchSpy.mockRestore();
    }
    expect(otp).toBeTruthy();

    const signInRes = await authRequest('/api/auth/sign-in/email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
});

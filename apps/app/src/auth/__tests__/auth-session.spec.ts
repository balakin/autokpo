import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ensureNoAuthError,
  logoutSession,
  startOAuthFlow,
} from '../auth-session';

const getSessionMock = vi.hoisted(() => vi.fn());
const signInSocialMock = vi.hoisted(() => vi.fn());
const signInEmailOtpMock = vi.hoisted(() => vi.fn());
const sendVerificationOtpMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());

vi.mock('../auth-client', () => ({
  authClient: {
    getSession: getSessionMock,
    signIn: { social: signInSocialMock, emailOtp: signInEmailOtpMock },
    emailOtp: { sendVerificationOtp: sendVerificationOtpMock },
    signOut: signOutMock,
  },
}));

beforeEach(() => {
  getSessionMock.mockReset();
  signInSocialMock.mockReset();
  signInEmailOtpMock.mockReset();
  sendVerificationOtpMock.mockReset();
  signOutMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ensureNoAuthError', () => {
  it('does not throw on undefined', () => {
    expect(() => ensureNoAuthError(undefined)).not.toThrow();
  });

  it('does not throw on success result', () => {
    expect(() => ensureNoAuthError({ data: { userId: 'u1' } })).not.toThrow();
  });

  it('throws on string error', () => {
    expect(() => ensureNoAuthError({ error: 'bad' })).toThrow('bad');
  });

  it('throws on object error with message', () => {
    expect(() =>
      ensureNoAuthError({ error: { message: 'Auth failed' } }),
    ).toThrow('Auth failed');
  });
});

describe('startOAuthFlow', () => {
  it('calls google sign-in with provider-scoped callback URL', async () => {
    signInSocialMock.mockResolvedValue(undefined);
    await startOAuthFlow('google');
    expect(signInSocialMock).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/sign-in/oauth/google/callback',
      errorCallbackURL: '/sign-in/oauth/google/callback',
    });
  });

  it('calls github sign-in with provider-scoped callback URL', async () => {
    signInSocialMock.mockResolvedValue(undefined);
    await startOAuthFlow('github');
    expect(signInSocialMock).toHaveBeenCalledWith({
      provider: 'github',
      callbackURL: '/sign-in/oauth/github/callback',
      errorCallbackURL: '/sign-in/oauth/github/callback',
    });
  });
});

describe('requestEmailOtpSession', () => {
  it('requests sign-in otp for email', async () => {
    sendVerificationOtpMock.mockResolvedValue(undefined);
    const { requestEmailOtpSession: req } = await import('../auth-session');

    await req('user@example.com', 'test-captcha-token');

    expect(sendVerificationOtpMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      type: 'sign-in',
      fetchOptions: {
        headers: {
          'X-Preferred-Locale': 'sr-Latn',
          'x-captcha-response': 'test-captcha-token',
        },
      },
    });
  });
});

describe('verifyEmailOtpSession', () => {
  it('verifies otp sign-in', async () => {
    signInEmailOtpMock.mockResolvedValue(undefined);
    const { verifyEmailOtpSession: verify } = await import('../auth-session');

    await verify('user@example.com', '123456');

    expect(signInEmailOtpMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      otp: '123456',
    });
  });
});

describe('logoutSession', () => {
  it('calls signOut', async () => {
    signOutMock.mockResolvedValue({ data: { success: true } });
    await logoutSession();
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it('throws when signOut fails', async () => {
    signOutMock.mockResolvedValue({ error: { message: 'Network error' } });
    await expect(logoutSession()).rejects.toThrow('Network error');
  });
});

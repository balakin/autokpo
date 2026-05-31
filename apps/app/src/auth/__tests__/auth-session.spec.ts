import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type StoredSession,
  SESSION_KEY,
  logoutSession,
  readStoredSession,
  startOAuthFlow,
  writeStoredSession,
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
  localStorage.clear();
  getSessionMock.mockReset();
  signInSocialMock.mockReset();
  signInEmailOtpMock.mockReset();
  sendVerificationOtpMock.mockReset();
  signOutMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('readStoredSession', () => {
  it('returns null when nothing stored', () => {
    expect(readStoredSession()).toBeNull();
  });

  it('returns the stored session object', () => {
    const session: StoredSession = {
      userId: 'user-abc',
      email: 'user@example.com',
      sessionId: 'session-xyz',
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    expect(readStoredSession()).toEqual(session);
  });
});

describe('writeStoredSession', () => {
  it('writes json session', () => {
    writeStoredSession({
      userId: 'u1',
      email: 'u@example.com',
      sessionId: null,
    });
    expect(localStorage.getItem(SESSION_KEY)).toBe(
      JSON.stringify({ userId: 'u1', email: 'u@example.com', sessionId: null }),
    );
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
    const { requestEmailOtpSession } = await import('../auth-session');

    await requestEmailOtpSession('user@example.com', 'test-captcha-token');

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
    const { verifyEmailOtpSession } = await import('../auth-session');

    await verifyEmailOtpSession('user@example.com', '123456');

    expect(signInEmailOtpMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      otp: '123456',
    });
  });
});

describe('logoutSession', () => {
  it('calls signOut and clears stored user', async () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ userId: 'user-abc', email: null, sessionId: null }),
    );
    signOutMock.mockResolvedValue({ data: { success: true } });
    await logoutSession();
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('does not clear stored user when signOut fails', async () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ userId: 'user-abc', email: null, sessionId: null }),
    );
    signOutMock.mockResolvedValue({ error: { message: 'Network error' } });
    await expect(logoutSession()).rejects.toThrow('Network error');
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
  });
});

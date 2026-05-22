import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type StoredSession,
  SESSION_KEY,
  logoutSession,
  readStoredSession,
  refreshSession,
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
      image: 'https://img.example.com/a.png',
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    expect(readStoredSession()).toEqual(session);
  });

  it('migrates the legacy key', () => {
    localStorage.setItem('autokpo:remembered-local-user', 'legacy-user');

    expect(readStoredSession()).toEqual({
      userId: 'legacy-user',
      email: null,
      image: null,
      imageStatus: 'ready',
    });
    expect(localStorage.getItem('autokpo:remembered-local-user')).toBeNull();
  });
});

describe('writeStoredSession', () => {
  it('writes json session', () => {
    writeStoredSession({ userId: 'u1', email: 'u@example.com', image: null });
    expect(localStorage.getItem(SESSION_KEY)).toBe(
      JSON.stringify({ userId: 'u1', email: 'u@example.com', image: null }),
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

describe('refreshSession', () => {
  it('stores and returns session user id', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: 'google-user',
          email: 'google@example.com',
          image: 'https://img.example.com/google.png',
        },
      },
    });

    await expect(refreshSession()).resolves.toBe('google-user');
    expect(localStorage.getItem(SESSION_KEY)).toBe(
      JSON.stringify({
        userId: 'google-user',
        email: 'google@example.com',
        image: 'https://img.example.com/google.png',
        imageStatus: 'ready',
      }),
    );
  });

  it('preserves importing image status from session payload', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: 'google-user',
          email: 'google@example.com',
          image: 'https://img.example.com/google.png',
          imageStatus: 'importing',
        },
      },
    });

    await expect(refreshSession()).resolves.toBe('google-user');
    expect(localStorage.getItem(SESSION_KEY)).toBe(
      JSON.stringify({
        userId: 'google-user',
        email: 'google@example.com',
        image: 'https://img.example.com/google.png',
        imageStatus: 'importing',
      }),
    );
  });

  it('clears stored user and returns null when signed out', async () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ userId: 'old-user', email: null, image: null }),
    );
    getSessionMock.mockResolvedValue({ data: null });

    await expect(refreshSession()).resolves.toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
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
    localStorage.setItem(SESSION_KEY, 'user-abc');
    signOutMock.mockResolvedValue(undefined);
    await logoutSession();
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});

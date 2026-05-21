import { clearLocalEncryptionUnlockMaterial } from '../e2ee/cleanup';
import { getStoredLocale } from '../i18n/locale-storage';

import { authClient } from './auth-client';

export const SESSION_KEY = 'autokpo:session';
const LEGACY_SESSION_KEY = 'autokpo:remembered-local-user';

export type StoredSession = {
  userId: string;
  email: string | null;
  image: string | null;
  imageStatus?: 'importing' | 'ready';
};

function isStoredSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const maybe = value as Partial<StoredSession>;
  return (
    typeof maybe.userId === 'string' &&
    (typeof maybe.email === 'string' || maybe.email === null) &&
    (typeof maybe.image === 'string' || maybe.image === null) &&
    (maybe.imageStatus === undefined ||
      maybe.imageStatus === 'importing' ||
      maybe.imageStatus === 'ready')
  );
}

export function readStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isStoredSession(parsed)) {
        return parsed;
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  const legacyUserId = localStorage.getItem(LEGACY_SESSION_KEY);
  if (!legacyUserId) {
    return null;
  }

  const migratedSession: StoredSession = {
    userId: legacyUserId,
    email: null,
    image: null,
    imageStatus: 'ready',
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(migratedSession));
  localStorage.removeItem(LEGACY_SESSION_KEY);
  return migratedSession;
}

export function writeStoredSession(session: StoredSession | null): void {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function ensureNoAuthError(result: unknown): void {
  if (!result || typeof result !== 'object') {
    return;
  }

  const maybeError =
    'error' in result
      ? result.error
      : 'data' in result &&
          result.data &&
          typeof result.data === 'object' &&
          'error' in result.data
        ? result.data.error
        : null;

  if (!maybeError) {
    return;
  }

  if (typeof maybeError === 'string') {
    throw new Error(maybeError);
  }

  if (typeof maybeError === 'object' && maybeError !== null) {
    if ('message' in maybeError && typeof maybeError.message === 'string') {
      throw new Error(maybeError.message);
    }
    if ('code' in maybeError && typeof maybeError.code === 'string') {
      throw new Error(maybeError.code);
    }
  }

  throw new Error('Authentication request failed.');
}

export async function startOAuthFlow(
  provider: 'google' | 'github',
): Promise<void> {
  await authClient.signIn.social({
    provider,
    callbackURL: `/sign-in/oauth/${provider}/callback`,
    errorCallbackURL: `/sign-in/oauth/${provider}/callback`,
  });
}

export async function requestEmailOtpSession(
  email: string,
  captchaToken: string,
): Promise<void> {
  const result = await authClient.emailOtp.sendVerificationOtp({
    email,
    type: 'sign-in',
    fetchOptions: {
      headers: {
        'X-Preferred-Locale': getStoredLocale(),
        'x-captcha-response': captchaToken,
      },
    },
  });
  ensureNoAuthError(result);
}

export async function verifyEmailOtpSession(
  email: string,
  otp: string,
): Promise<void> {
  const result = await authClient.signIn.emailOtp({
    email,
    otp,
  });
  ensureNoAuthError(result);
}

export async function refreshSession(): Promise<string | null> {
  const session = await authClient.getSession();
  const nextUser = session.data?.user;
  if (!nextUser?.id) {
    clearLocalEncryptionUnlockMaterial();
    writeStoredSession(null);
    return null;
  }

  writeStoredSession({
    userId: nextUser.id,
    email: nextUser.email ?? null,
    image: nextUser.image ?? null,
    imageStatus: nextUser.imageStatus === 'importing' ? 'importing' : 'ready',
  });
  return nextUser.id;
}

export async function logoutSession(): Promise<void> {
  await authClient.signOut();
  if (typeof caches !== 'undefined') {
    await caches.delete('avatars');
  }
  clearLocalEncryptionUnlockMaterial();
  writeStoredSession(null);
}

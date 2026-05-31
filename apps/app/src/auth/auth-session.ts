import { getStoredLocale } from '../i18n/locale-storage';

import { authClient } from './auth-client';

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

export async function logoutSession(): Promise<void> {
  const result = await authClient.signOut();
  ensureNoAuthError(result);
}

import type { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import {
  captcha as captchaPlugin,
  emailOTP as emailOtpPlugin,
} from 'better-auth/plugins';
import type { ExecutionContext } from 'hono';

import { DISPOSABLE_EMAIL_DOMAINS } from './disposable-email-blocklist';

const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';
const DEFAULT_LOCALE = 'sr-Latn';
const SUPPORTED_LOCALES = new Set(['sr-Latn', 'en', 'ru']);
const MAX_AUTH_EMAIL_LENGTH = 254;
const MAX_SESSION_USER_AGENT_LENGTH = 1024;
const MAX_SESSION_IP_ADDRESS_LENGTH = 128;

const DISABLED_AUTH_PATHS = [
  '/sign-in/email',
  '/sign-up/email',
  '/request-password-reset',
  '/reset-password',
  '/send-verification-email',
  '/verify-email',
  '/change-password',
  '/change-email',
  '/update-user',
  '/set-password',
  '/revoke-sessions',
  '/link-social',
  '/unlink-account',
  '/email-otp/check-verification-otp',
  '/email-otp/verify-email',
  '/email-otp/request-password-reset',
  '/email-otp/reset-password',
  '/email-otp/request-email-change',
  '/email-otp/change-email',
  '/forget-password/email-otp',
];

type AccountCreateData = {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

type SessionMetadata = {
  userAgent?: string | null;
  ipAddress?: string | null;
};

type SocialAuthOptions = {
  clientId: string;
  clientSecret: string;
};

type EmailOtpOptions = {
  sendEmail: (to: string, otp: string, locale: string) => Promise<void>;
};

type AccountDeletedEmailOptions = {
  sendEmail: (to: string, locale: string) => Promise<void>;
};

type AuthOptionsInput = {
  google: SocialAuthOptions;
  github: SocialAuthOptions;
  emailOtpConfig: EmailOtpOptions;
  accountDeletedEmailConfig: AccountDeletedEmailOptions;
  executionCtx: ExecutionContext;
  turnstileSecretKey?: string;
};

export function getAuthOptions({
  google,
  github,
  emailOtpConfig,
  accountDeletedEmailConfig,
  executionCtx,
  turnstileSecretKey,
}: AuthOptionsInput) {
  return {
    disabledPaths: DISABLED_AUTH_PATHS,
    socialProviders: {
      google: {
        ...google,
        disableDefaultScope: true,
        scope: ['openid', 'email'],
        disableIdTokenSignIn: true,
        overrideUserInfoOnSignIn: false,
        mapProfileToUser: () => ({ name: '', image: undefined }),
      },
      github: {
        ...github,
        overrideUserInfoOnSignIn: false,
        mapProfileToUser: () => ({ name: '', image: undefined }),
      },
    },
    account: {
      accountLinking: {
        enabled: false,
      },
      updateAccountOnSignIn: false,
      storeStateStrategy: 'cookie',
    },
    databaseHooks: {
      account: {
        create: {
          // Persist only identity-linking account fields and explicit nulls for
          // token/credential columns. Better Auth merges hook data over the
          // original object, so explicit nulls are required for every sensitive
          // column in the schema.
          before(account: AccountCreateData) {
            return Promise.resolve({
              data: {
                id: account.id,
                accountId: account.accountId,
                providerId: account.providerId,
                userId: account.userId,
                accessToken: null,
                refreshToken: null,
                idToken: null,
                scope: null,
                accessTokenExpiresAt: null,
                refreshTokenExpiresAt: null,
                password: null,
                createdAt: account.createdAt,
                updatedAt: account.updatedAt,
              },
            });
          },
        },
        update: {
          before() {
            return Promise.resolve({
              data: {
                accessToken: null,
                refreshToken: null,
                idToken: null,
                scope: null,
                accessTokenExpiresAt: null,
                refreshTokenExpiresAt: null,
                password: null,
              },
            });
          },
        },
      },
      session: {
        create: {
          before(session: SessionMetadata) {
            return Promise.resolve({
              data: normalizeSessionMetadata(session),
            });
          },
        },
        update: {
          before(session: SessionMetadata) {
            return Promise.resolve({
              data: normalizeSessionMetadata(session),
            });
          },
        },
      },
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'],
      },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 60,
      customRules: {
        '/email-otp/send-verification-otp': { window: 300, max: 5 },
      },
    },
    session: {
      freshAge: 0,
      expiresIn: 60 * 24 * 60 * 60,
      updateAge: 7 * 24 * 60 * 60,
    },
    user: {
      deleteUser: {
        enabled: true,
        afterDelete(user: { email: string }, request: Request | undefined) {
          const locale = getSupportedLocale(
            request?.headers.get('X-Preferred-Locale'),
          );
          executionCtx.waitUntil(
            accountDeletedEmailConfig.sendEmail(user.email, locale),
          );
          return Promise.resolve();
        },
      },
    },
    plugins: [
      captchaPlugin({
        provider: 'cloudflare-turnstile',
        secretKey: turnstileSecretKey ?? TURNSTILE_TEST_SECRET,
        endpoints: ['/email-otp/send-verification-otp'],
      }),
      emailOtpPlugin({
        resendStrategy: 'reuse',
        allowedAttempts: 5,
        expiresIn: 300,
        sendVerificationOTP({ email, otp, type }, ctx) {
          if (type !== 'sign-in') {
            return Promise.resolve();
          }

          const normalizedEmail = email.trim();
          if (normalizedEmail.length > MAX_AUTH_EMAIL_LENGTH) {
            throw new APIError('BAD_REQUEST', {
              message: 'Email address is too long.',
            });
          }

          const domain = normalizedEmail.split('@')[1]?.toLowerCase();
          if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
            throw new APIError('BAD_REQUEST', {
              message: 'Email domain not allowed.',
            });
          }

          const locale = getSupportedLocale(
            ctx?.request?.headers.get('X-Preferred-Locale'),
          );
          executionCtx.waitUntil(
            emailOtpConfig.sendEmail(normalizedEmail, otp, locale),
          );
          return Promise.resolve();
        },
      }),
    ],
  } satisfies Parameters<typeof betterAuth>[0];
}

function normalizeSessionMetadata(session: SessionMetadata): SessionMetadata {
  return {
    userAgent: boundOptionalString(
      session.userAgent,
      MAX_SESSION_USER_AGENT_LENGTH,
    ),
    ipAddress: boundOptionalString(
      session.ipAddress,
      MAX_SESSION_IP_ADDRESS_LENGTH,
    ),
  };
}

function boundOptionalString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  if (!value) return null;
  return value.slice(0, maxLength);
}

function getSupportedLocale(locale: string | null | undefined): string {
  if (!locale || locale.length > 16) return DEFAULT_LOCALE;
  return SUPPORTED_LOCALES.has(locale) ? locale : DEFAULT_LOCALE;
}

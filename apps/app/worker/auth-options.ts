import type { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import {
  captcha as captchaPlugin,
  emailOTP as emailOtpPlugin,
} from 'better-auth/plugins';
import type { ExecutionContext } from 'hono';

import { DISPOSABLE_EMAIL_DOMAINS } from './disposable-email-blocklist';

const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';

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

type AvatarImportOptions = {
  importPendingAvatar: (
    userId: string,
    pendingAvatarUrl: string,
  ) => Promise<void>;
  deleteUserAvatar: (image: string) => Promise<void>;
};

type AuthOptionsInput = {
  google: SocialAuthOptions;
  github: SocialAuthOptions;
  emailOtpConfig: EmailOtpOptions;
  accountDeletedEmailConfig: AccountDeletedEmailOptions;
  executionCtx: ExecutionContext;
  avatarImportConfig?: AvatarImportOptions;
  turnstileSecretKey?: string;
};

export function getAuthOptions({
  google,
  github,
  emailOtpConfig,
  accountDeletedEmailConfig,
  executionCtx,
  avatarImportConfig,
  turnstileSecretKey,
}: AuthOptionsInput) {
  return {
    socialProviders: { google, github },
    account: {
      accountLinking: {
        enabled: false,
      },
    },
    session: {
      freshAge: 0,
      expiresIn: 60 * 24 * 60 * 60,
      updateAge: 7 * 24 * 60 * 60,
    },
    rateLimit: {
      storage: 'database',
      customRules: {
        '/email-otp/send-verification-otp': { window: 300, max: 5 },
      },
    },
    user: {
      additionalFields: {
        imageStatus: {
          type: ['importing', 'ready'],
          required: false,
          defaultValue: 'ready',
          input: false,
        },
        pendingAvatarUrl: {
          type: 'string',
          required: false,
          input: false,
          returned: false,
        },
      },
      deleteUser: {
        enabled: true,
        afterDelete(
          user: { email: string; image?: string | null },
          request: Request | undefined,
        ) {
          const locale =
            request?.headers.get('X-Preferred-Locale') ?? 'sr-Latn';
          executionCtx.waitUntil(
            accountDeletedEmailConfig.sendEmail(user.email, locale),
          );
          if (user.image && avatarImportConfig) {
            executionCtx.waitUntil(
              avatarImportConfig.deleteUserAvatar(user.image),
            );
          }
          return Promise.resolve();
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before(user: Record<string, unknown>) {
            const pendingAvatarUrl =
              typeof user.image === 'string' && user.image.length > 0
                ? user.image
                : null;

            return Promise.resolve({
              data: {
                ...user,
                image: null,
                imageStatus: pendingAvatarUrl ? 'importing' : 'ready',
                pendingAvatarUrl,
              },
            });
          },
          after(user: Record<string, unknown>) {
            const userId = typeof user.id === 'string' ? user.id : null;
            const pendingAvatarUrl =
              typeof user.pendingAvatarUrl === 'string' &&
              user.pendingAvatarUrl.length > 0
                ? user.pendingAvatarUrl
                : null;

            if (userId && pendingAvatarUrl && avatarImportConfig) {
              executionCtx.waitUntil(
                avatarImportConfig.importPendingAvatar(
                  userId,
                  pendingAvatarUrl,
                ),
              );
            }

            return Promise.resolve();
          },
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

          const domain = email.split('@')[1]?.toLowerCase();
          if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
            throw new APIError('BAD_REQUEST', {
              message: 'Email domain not allowed.',
            });
          }

          const locale =
            ctx?.request?.headers.get('X-Preferred-Locale') ?? 'sr-Latn';
          executionCtx.waitUntil(emailOtpConfig.sendEmail(email, otp, locale));
          return Promise.resolve();
        },
      }),
    ],
  } satisfies Parameters<typeof betterAuth>[0];
}

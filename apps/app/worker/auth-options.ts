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
      encryptOAuthTokens: true,
    },
    databaseHooks: {
      account: {
        create: {
          // Null out all OAuth tokens before the account row is persisted.
          // better-auth's hook merges result.data on top of the original — explicit
          // nulls are required to overwrite token fields; omitting them leaves the
          // originals intact.
          before(account) {
            return Promise.resolve({
              data: {
                ...account,
                accessToken: null,
                refreshToken: null,
                idToken: null,
                scope: null,
                accessTokenExpiresAt: null,
                refreshTokenExpiresAt: null,
              },
            });
          },
        },
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
      deleteUser: {
        enabled: true,
        afterDelete(user: { email: string }, request: Request | undefined) {
          const locale =
            request?.headers.get('X-Preferred-Locale') ?? 'sr-Latn';
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

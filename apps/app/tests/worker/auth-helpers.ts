import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import { testUtils } from 'better-auth/plugins';
import { env } from 'cloudflare:workers';
import type { ExecutionContext } from 'hono';
import { expect, vi } from 'vitest';

import { getAuthOptions } from '../../worker/auth/auth-options';
import { getDb } from '../../worker/db';
import { account, user } from '../../worker/db/schema/auth';
import * as schema from '../../worker/db/schema/auth';

export const TEST_APP_URL = 'http://localhost:5173';
const TEST_BETTER_AUTH_SECRET = 'test-better-auth-secret-0123456789abcdef';
const TEST_GOOGLE_CLIENT_ID = 'test-google-client-id';
const TEST_GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
const TEST_GITHUB_CLIENT_ID = 'test-github-client-id';
const TEST_GITHUB_CLIENT_SECRET = 'test-github-client-secret';
const TEST_RESEND_API_KEY = 'test-resend-api-key';
const TEST_RESEND_FROM_EMAIL = 'AutoKPO <autokpo@resend.dev>';

export const syncRateLimitMock = vi.fn<RateLimit['limit']>(() =>
  Promise.resolve({ success: true }),
);
export const e2eeRateLimitMock = vi.fn<RateLimit['limit']>(() =>
  Promise.resolve({ success: true }),
);
export const exchangeRatesRateLimitMock = vi.fn<RateLimit['limit']>(() =>
  Promise.resolve({ success: true }),
);
export const authRateLimitMock = vi.fn<RateLimit['limit']>(() =>
  Promise.resolve({ success: true }),
);

export function resetRateLimitMocks() {
  syncRateLimitMock.mockReset();
  syncRateLimitMock.mockResolvedValue({ success: true });
  e2eeRateLimitMock.mockReset();
  e2eeRateLimitMock.mockResolvedValue({ success: true });
  exchangeRatesRateLimitMock.mockReset();
  exchangeRatesRateLimitMock.mockResolvedValue({ success: true });
  authRateLimitMock.mockReset();
  authRateLimitMock.mockResolvedValue({ success: true });
}

export const workerTestEnv = {
  ...env,
  APP_URL: TEST_APP_URL,
  BETTER_AUTH_SECRET: TEST_BETTER_AUTH_SECRET,
  GOOGLE_CLIENT_ID: TEST_GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: TEST_GOOGLE_CLIENT_SECRET,
  RESEND_API_KEY: TEST_RESEND_API_KEY,
  RESEND_FROM_EMAIL: TEST_RESEND_FROM_EMAIL,
  SYNC_RATE_LIMITER: { limit: syncRateLimitMock },
  E2EE_RATE_LIMITER: { limit: e2eeRateLimitMock },
  EXCHANGE_RATES_RATE_LIMITER: { limit: exchangeRatesRateLimitMock },
  AUTH_RATE_LIMITER: { limit: authRateLimitMock },
} as Env;

const db = getDb(workerTestEnv.DB);

const authOptions = getAuthOptions({
  google: {
    clientId: TEST_GOOGLE_CLIENT_ID,
    clientSecret: TEST_GOOGLE_CLIENT_SECRET,
  },
  github: {
    clientId: TEST_GITHUB_CLIENT_ID,
    clientSecret: TEST_GITHUB_CLIENT_SECRET,
  },
  emailOtpConfig: {
    sendEmail: vi.fn(),
  },
  accountDeletedEmailConfig: {
    sendEmail: vi.fn(),
  },
  executionCtx: {} as ExecutionContext,
});

const testAuth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  secondaryStorage: {
    get: (key) => workerTestEnv.AUTH_KV.get(key),
    set: (key, value, ttl) =>
      workerTestEnv.AUTH_KV.put(
        key,
        value,
        ttl ? { expirationTtl: ttl } : undefined,
      ),
    delete: (key) => workerTestEnv.AUTH_KV.delete(key),
  },
  secret: TEST_BETTER_AUTH_SECRET,
  baseURL: TEST_APP_URL,
  ...authOptions,
  plugins: [...authOptions.plugins, testUtils()],
});

export async function expectOtpEmailSent(
  callback: () => Promise<unknown>,
): Promise<void> {
  const fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(null, { status: 200 }));

  try {
    await callback();
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  } finally {
    fetchSpy.mockRestore();
  }
}

export async function getAuthHeaders(userId: string): Promise<Headers> {
  await db
    .insert(user)
    .values({
      id: userId,
      name: 'Test User',
      email: `${userId}@example.com`,
      emailVerified: true,
    })
    .onConflictDoNothing();

  const ctx = await testAuth.$context;
  return ctx.test.getAuthHeaders({ userId });
}

export async function createAuthAccount(accountData: {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  idToken?: string | null;
  scope?: string | null;
  accessTokenExpiresAt?: Date | null;
  refreshTokenExpiresAt?: Date | null;
  password?: string | null;
}) {
  const ctx = await testAuth.$context;
  return ctx.internalAdapter.createAccount(accountData);
}

export async function clearAuthData() {
  resetRateLimitMocks();
  await db.delete(account);
  await db.delete(user);
}

export { db };

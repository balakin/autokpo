import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import type { ExecutionContext } from 'hono';

import { getDb } from '../db';
import * as schema from '../db/schema/auth';

import { getAuthOptions } from './auth-options';
import { sendAccountDeletedEmail } from './send-account-deleted-email';
import { sendOtpEmail } from './send-otp-email';

type SessionUser = {
  id: string;
};

export type Session = {
  user: SessionUser;
};

type SessionContext = {
  env: Env;
  executionCtx: ExecutionContext;
  req: { raw: Request };
};

export async function getSession(c: SessionContext): Promise<Session | null> {
  const auth = getAuth(c.env, c.executionCtx);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session?.user?.id) {
    return null;
  }
  return {
    user: { id: session.user.id },
  };
}

export function unauthorizedResponse() {
  return Response.json({ code: 'unauthorized' }, { status: 401 });
}

export async function requireSession(
  c: SessionContext,
): Promise<Session | Response> {
  const session = await getSession(c);
  if (!session) {
    return unauthorizedResponse();
  }
  return session;
}

export async function authHandler(
  request: Request,
  env: Env,
  executionCtx: ExecutionContext,
): Promise<Response> {
  return getAuth(env, executionCtx).handler(request);
}

function getAuth(env: Env, executionCtx: ExecutionContext) {
  return betterAuth({
    database: drizzleAdapter(getDb(env.DB), {
      provider: 'sqlite',
      schema,
    }),
    secondaryStorage: {
      get: (key) => env.AUTH_KV.get(key),
      set: (key, value, ttl) =>
        env.AUTH_KV.put(key, value, ttl ? { expirationTtl: ttl } : undefined),
      delete: (key) => env.AUTH_KV.delete(key),
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.APP_URL,
    ...getAuthOptions({
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
      emailOtpConfig: {
        sendEmail: (to, otp, locale) =>
          sendOtpEmail(
            env.RESEND_API_KEY,
            env.RESEND_FROM_EMAIL,
            to,
            otp,
            locale,
          ),
      },
      accountDeletedEmailConfig: {
        sendEmail: (to, locale) =>
          sendAccountDeletedEmail(
            env.RESEND_API_KEY,
            env.RESEND_FROM_EMAIL,
            to,
            locale,
          ),
      },
      executionCtx,
      turnstileSecretKey: env.TURNSTILE_SECRET_KEY,
    }),
  });
}

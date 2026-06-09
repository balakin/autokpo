import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { ExecutionContext } from 'hono';

import { getAuthOptions } from './worker/auth/auth-options';

// CLI-only config for `pnpm auth:generate`.
// Uses a mock DB so the better-auth CLI can run in Node.js
// without Cloudflare D1 bindings or a real SQLite driver.
const db = {} as BaseSQLiteDatabase<'sync', void>;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  ...getAuthOptions({
    google: { clientId: '', clientSecret: '' },
    github: { clientId: '', clientSecret: '' },
    emailOtpConfig: {
      sendEmail: async () => {},
    },
    accountDeletedEmailConfig: {
      sendEmail: async () => {},
    },
    executionCtx: {} as ExecutionContext,
  }),
});

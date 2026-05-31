import { authClient } from '../auth/auth-client';
import { ensureNoAuthError } from '../auth/auth-session';
import { cleanupSignedOutSession } from '../auth/session-cleanup';
import { getStoredLocale } from '../i18n/locale-storage';

export interface AccountSession {
  id: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: number | null;
  expiresAt: number | null;
}

interface BetterAuthSessionLike {
  id?: unknown;
  token?: unknown;
  ipAddress?: unknown;
  userAgent?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  expiresAt?: unknown;
}

export { buildAccountExport } from './export';
export type { AccountExport } from './export';

export async function deleteAccount(userId: string): Promise<void> {
  const result = await authClient.deleteUser({
    fetchOptions: {
      headers: { 'X-Preferred-Locale': getStoredLocale() },
    },
  });

  ensureNoAuthError(result);
  await cleanupSignedOutSession(userId);
}

export async function fetchAccountSessions(): Promise<AccountSession[]> {
  const sessionsResult = await authClient.listSessions();

  ensureNoAuthError(sessionsResult);

  return readSessionsFromResult(sessionsResult).map((session, index) => {
    const id = getString(session.id) ?? `session-${index}`;
    const token = getString(session.token) ?? '';
    const createdAt = getTimestamp(session.createdAt);
    const expiresAt = getTimestamp(session.expiresAt);

    return {
      id,
      token,
      ipAddress: getString(session.ipAddress),
      userAgent: getString(session.userAgent),
      createdAt,
      expiresAt,
    };
  });
}

export async function revokeAccountSession(token: string): Promise<void> {
  const result = await authClient.revokeSession({ token });

  ensureNoAuthError(result);
}

export async function revokeOtherAccountSessions(): Promise<void> {
  const result = await authClient.revokeOtherSessions();

  ensureNoAuthError(result);
}

function readSessionsFromResult(result: unknown): BetterAuthSessionLike[] {
  if (Array.isArray(result)) return result as BetterAuthSessionLike[];

  if (!result || typeof result !== 'object' || !('data' in result)) {
    return [];
  }

  const data = result.data;
  if (Array.isArray(data)) return data as BetterAuthSessionLike[];

  if (
    data &&
    typeof data === 'object' &&
    'sessions' in data &&
    Array.isArray(data.sessions)
  ) {
    return data.sessions as BetterAuthSessionLike[];
  }

  return [];
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function getTimestamp(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || value.length === 0) return null;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

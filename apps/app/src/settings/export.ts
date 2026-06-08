import { authClient } from '../auth/auth-client';
import { yMapToBook } from '../crdt';
import type { TypedDoc } from '../crdt/typed-doc';

export interface StateExport {
  exportedAt: string;
  schemaVersion: number;
  locale: string;
  books: ReturnType<typeof yMapToBook>[];
}

export interface AccountExportSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  isCurrent: boolean;
}

export interface AccountExport {
  exportedAt: string;
  schemaVersion: number;
  account: {
    id: string | null;
    email: string | null;
    emailVerified: boolean;
    createdAt: string | null;
  };
  providers: { name: string; accountId: string }[];
  sessions: AccountExportSession[];
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildStateExport(ydoc: TypedDoc): StateExport {
  const meta = ydoc.getMap('meta');
  const user = ydoc.getMap('user');
  const booksMap = ydoc.getMap('books');

  const books = Array.from(booksMap.values()).map(yMapToBook);

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: meta.get('schemaVersion') ?? 1,
    locale: user.get('locale') ?? '',
    books,
  };
}

export async function buildAccountExport(): Promise<AccountExport> {
  const [sessionResult, accountsResult, sessionsResult] = await Promise.all([
    authClient.getSession(),
    authClient.listAccounts(),
    authClient.listSessions(),
  ]);

  const u = sessionResult.data?.user;
  const currentSessionId = sessionResult.data?.session?.id ?? null;

  const createdAt =
    u?.createdAt instanceof Date
      ? u.createdAt.toISOString()
      : typeof u?.createdAt === 'string'
        ? u.createdAt
        : null;

  const accounts = Array.isArray(accountsResult.data)
    ? accountsResult.data
    : [];
  const providers = accounts.flatMap((a: unknown) => {
    if (a && typeof a === 'object') {
      const rec = a as Record<string, unknown>;
      if (
        typeof rec.providerId === 'string' &&
        typeof rec.accountId === 'string'
      ) {
        return [{ name: rec.providerId, accountId: rec.accountId }];
      }
    }
    return [];
  });

  const rawSessions = readSessionsFromResult(sessionsResult);
  const sessions: AccountExportSession[] = rawSessions.map(
    (s: Record<string, unknown>, index: number) => {
      const id = typeof s.id === 'string' ? s.id : `session-${index}`;
      return {
        id,
        ipAddress: typeof s.ipAddress === 'string' ? s.ipAddress : null,
        userAgent: typeof s.userAgent === 'string' ? s.userAgent : null,
        createdAt: toIsoString(s.createdAt),
        expiresAt: toIsoString(s.expiresAt),
        isCurrent: currentSessionId !== null && id === currentSessionId,
      };
    },
  );

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    account: {
      id: u?.id ?? null,
      email: u?.email ?? null,
      emailVerified: u?.emailVerified ?? false,
      createdAt,
    },
    providers,
    sessions,
  };
}

function readSessionsFromResult(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  if (!result || typeof result !== 'object' || !('data' in result)) return [];
  const data = (result as Record<string, unknown>).data;
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (
    data &&
    typeof data === 'object' &&
    'sessions' in data &&
    Array.isArray((data as Record<string, unknown>).sessions)
  ) {
    return (data as Record<string, unknown>).sessions as Record<
      string,
      unknown
    >[];
  }
  return [];
}

function toIsoString(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.length > 0) {
    const ts = Date.parse(value);
    return Number.isNaN(ts) ? null : new Date(ts).toISOString();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return null;
}

export function exportFilename(prefix: string): string {
  const date = new Intl.DateTimeFormat('en-CA').format(new Date());
  return `${prefix}-${date}.json`;
}

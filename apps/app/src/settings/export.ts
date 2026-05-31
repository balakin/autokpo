import { authClient } from '../auth/auth-client';
import { yMapToBook } from '../crdt';
import type { TypedDoc } from '../crdt/typed-doc';

export interface StateExport {
  exportedAt: string;
  schemaVersion: number;
  locale: string;
  books: ReturnType<typeof yMapToBook>[];
}

export interface AccountExport {
  exportedAt: string;
  schemaVersion: number;
  account: {
    email: string | null;
    emailVerified: boolean;
    createdAt: string | null;
  };
  providers: { name: string; accountId: string }[];
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
  const [sessionResult, accountsResult] = await Promise.all([
    authClient.getSession(),
    authClient.listAccounts(),
  ]);

  const u = sessionResult.data?.user;

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

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    account: {
      email: u?.email ?? null,
      emailVerified: u?.emailVerified ?? false,
      createdAt,
    },
    providers,
  };
}

export function exportFilename(prefix: string): string {
  const date = new Intl.DateTimeFormat('en-CA').format(new Date());
  return `${prefix}-${date}.json`;
}

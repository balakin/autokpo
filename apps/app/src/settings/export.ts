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
  account: {
    name: string | null;
    email: string | null;
    emailVerified: boolean;
    image: string | null;
    createdAt: string | null;
  };
  providers: string[];
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
    authClient.getSession({ query: { disableCookieCache: true } }),
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
  const providers = accounts
    .map((a: unknown) => {
      if (a && typeof a === 'object' && 'providerId' in a) {
        return typeof (a as Record<string, unknown>).providerId === 'string'
          ? ((a as Record<string, unknown>).providerId as string)
          : null;
      }
      return null;
    })
    .filter((p): p is string => p !== null);

  return {
    exportedAt: new Date().toISOString(),
    account: {
      name: u?.name ?? null,
      email: u?.email ?? null,
      emailVerified: u?.emailVerified ?? false,
      image: u?.image ?? null,
      createdAt,
    },
    providers,
  };
}

export function exportFilename(prefix: string): string {
  const date = new Intl.DateTimeFormat('en-CA').format(new Date());
  return `${prefix}-${date}.json`;
}

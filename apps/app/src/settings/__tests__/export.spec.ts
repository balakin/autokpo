import { beforeEach, describe, expect, it, vi } from 'vitest';

import { YArray, YDoc, YMap } from '../../crdt';
import type { TypedDoc, BookMapData } from '../../crdt/typed-doc';
import type { EntityProfile } from '../../entity-profiles/entity-profile-schema';
import type { KpoEntry } from '../../entries/entries-schema';
import type { Signature } from '../../signatures/signature-schema';
import { buildStateExport, buildAccountExport } from '../export';

const mockGetSession = vi.fn<() => Promise<unknown>>();
const mockListAccounts = vi.fn<() => Promise<unknown>>();
const mockListSessions = vi.fn<() => Promise<unknown>>();

vi.mock('../../auth/auth-client', () => ({
  authClient: {
    getSession: () => mockGetSession(),
    listAccounts: () => mockListAccounts(),
    listSessions: () => mockListSessions(),
  },
}));

function makeDoc(): TypedDoc {
  return new YDoc();
}

function seedDoc(
  doc: TypedDoc,
  {
    schemaVersion = 1,
    locale = 'sr-Latn',
  }: { schemaVersion?: number; locale?: string } = {},
): void {
  doc.transact(() => {
    doc.getMap('meta').set('schemaVersion', schemaVersion);
    doc.getMap('user').set('locale', locale);
  });
}

function addBook(
  doc: TypedDoc,
  opts: {
    id?: string;
    year?: number;
    withProfile?: boolean;
    withSignature?: boolean;
    entries?: Partial<KpoEntry>[];
  } = {},
): string {
  const id = opts.id ?? 'book-1';
  doc.transact(() => {
    const yBook = new YMap<BookMapData>();
    yBook.set('id', id);
    yBook.set('year', opts.year ?? 2024);
    yBook.set('createdAt', '2024-01-01T00:00:00.000Z');
    yBook.set('favorite', false);
    const entries = new YArray<KpoEntry>();
    for (const e of opts.entries ?? []) {
      const yEntry = new YMap<KpoEntry>();
      yEntry.set('id', e.id ?? 'entry-1');
      yEntry.set('datumPrometa', e.datumPrometa ?? '2024-03-15');
      yEntry.set('opisPrometa', e.opisPrometa ?? 'Test');
      yEntry.set('odProdajeProizvoda', e.odProdajeProizvoda ?? 0);
      yEntry.set('odIzvrsenihUsluga', e.odIzvrsenihUsluga ?? 1000);
      entries.push([yEntry]);
    }
    yBook.set('entries', entries);
    if (opts.withProfile) {
      const yProfile = new YMap<EntityProfile>();
      yProfile.set('pib', '123456789');
      yProfile.set('obveznik', 'Test d.o.o.');
      yProfile.set('firmaRadnje', 'Test firma');
      yProfile.set('sediste', 'Beograd');
      yProfile.set('sifraPoreskogObveznika', '12345678');
      yProfile.set('sifraDelatnosti', '6201');
      yBook.set('profile', yProfile);
    }
    if (opts.withSignature) {
      const ySignature = new YMap<Signature>();
      ySignature.set('sastavioIme', 'Petar Petrović');
      ySignature.set('odgovornoLiceIme', 'Marko Marković');
      yBook.set('signature', ySignature);
    }
    doc.getMap('books').set(id, yBook);
  });
  return id;
}

describe('buildStateExport', () => {
  it('produces correct top-level shape', () => {
    const doc = makeDoc();
    seedDoc(doc, { schemaVersion: 1, locale: 'en' });
    const result = buildStateExport(doc);
    expect(result.schemaVersion).toBe(1);
    expect(result.locale).toBe('en');
    expect(typeof result.exportedAt).toBe('string');
    expect(new Date(result.exportedAt).toISOString()).toBe(result.exportedAt);
  });

  it('exports empty books array when no books exist', () => {
    const doc = makeDoc();
    seedDoc(doc);
    const result = buildStateExport(doc);
    expect(result.books).toEqual([]);
  });

  it('exports a book with no profile or signature', () => {
    const doc = makeDoc();
    seedDoc(doc);
    addBook(doc, { id: 'book-1', year: 2024 });
    const result = buildStateExport(doc);
    expect(result.books).toHaveLength(1);
    expect(result.books[0].id).toBe('book-1');
    expect(result.books[0].year).toBe(2024);
    expect(result.books[0].profile).toBeNull();
    expect(result.books[0].signature).toBeNull();
    expect(result.books[0].entries).toEqual([]);
  });

  it('exports a book with profile, signature, and entries', () => {
    const doc = makeDoc();
    seedDoc(doc);
    addBook(doc, {
      id: 'book-2',
      year: 2023,
      withProfile: true,
      withSignature: true,
      entries: [
        {
          id: 'entry-1',
          datumPrometa: '2023-06-01',
          opisPrometa: 'Usluge',
          odProdajeProizvoda: 0,
          odIzvrsenihUsluga: 50000,
        },
      ],
    });
    const result = buildStateExport(doc);
    const book = result.books[0];
    expect(book.profile).toMatchObject({ pib: '123456789' });
    expect(book.signature).toMatchObject({ sastavioIme: 'Petar Petrović' });
    expect(book.entries).toHaveLength(1);
    expect(book.entries[0]).toMatchObject({
      id: 'entry-1',
      datumPrometa: '2023-06-01',
      opisPrometa: 'Usluge',
      odProdajeProizvoda: 0,
      odIzvrsenihUsluga: 50000,
    });
  });
});

describe('buildAccountExport', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockListAccounts.mockReset();
    mockListSessions.mockReset();
    mockListSessions.mockResolvedValue({ data: [] });
  });

  it('returns correct shape for a complete account', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { id: 'sess-1' },
        user: {
          id: 'user-1',
          email: 'ana@example.com',
          emailVerified: true,
          createdAt: new Date('2025-01-15T10:00:00.000Z'),
        },
      },
    });
    mockListAccounts.mockResolvedValue({
      data: [{ providerId: 'github', accountId: '12345' }],
    });
    mockListSessions.mockResolvedValue({
      data: [
        {
          id: 'sess-1',
          token: 'tok-abc',
          ipAddress: '1.2.3.4',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2025-06-01T08:00:00.000Z'),
          expiresAt: new Date('2025-07-01T08:00:00.000Z'),
        },
      ],
    });

    const result = await buildAccountExport();

    expect(result.account).toMatchObject({
      id: 'user-1',
      email: 'ana@example.com',
      emailVerified: true,
      createdAt: '2025-01-15T10:00:00.000Z',
    });
    expect(result.account).not.toHaveProperty('name');
    expect(result.account).not.toHaveProperty('image');
    expect(result.providers).toEqual([{ name: 'github', accountId: '12345' }]);
    expect(typeof result.exportedAt).toBe('string');
    expect(result.schemaVersion).toBe(1);
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]).toMatchObject({
      id: 'sess-1',
      ipAddress: '1.2.3.4',
      userAgent: 'Mozilla/5.0',
      isCurrent: true,
    });
  });

  it('falls back to null createdAt when not available', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        user: {
          id: 'user-2',
          email: 'user@example.com',
          emailVerified: false,
        },
      },
    });
    mockListAccounts.mockResolvedValue({ data: [] });

    const result = await buildAccountExport();

    expect(result.account.createdAt).toBeNull();
    expect(result.providers).toEqual([]);
  });

  it('omits providers where accountId is missing', async () => {
    mockGetSession.mockResolvedValue({
      data: { user: { email: 'x@x.com', emailVerified: false } },
    });
    mockListAccounts.mockResolvedValue({
      data: [{ providerId: 'google' }],
    });

    const result = await buildAccountExport();
    expect(result.providers).toEqual([]);
  });

  it('falls back to empty providers array when listAccounts returns unexpected shape', async () => {
    mockGetSession.mockResolvedValue({
      data: { user: { email: 'x@x.com', emailVerified: false } },
    });
    mockListAccounts.mockResolvedValue({ data: null });

    const result = await buildAccountExport();
    expect(result.providers).toEqual([]);
  });

  it('converts session timestamps to ISO strings and sets isCurrent correctly', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { id: 'sess-current' },
        user: { email: 'u@u.com', emailVerified: true },
      },
    });
    mockListAccounts.mockResolvedValue({ data: [] });
    mockListSessions.mockResolvedValue({
      data: [
        {
          id: 'sess-current',
          token: 'tok-1',
          ipAddress: '10.0.0.1',
          userAgent: 'Chrome/120',
          createdAt: new Date('2025-05-01T00:00:00.000Z'),
          expiresAt: new Date('2025-06-01T00:00:00.000Z'),
        },
        {
          id: 'sess-other',
          token: 'tok-2',
          ipAddress: '10.0.0.2',
          userAgent: 'Firefox/115',
          createdAt: 1_746_057_600_000,
          expiresAt: 1_748_649_600_000,
        },
      ],
    });

    const result = await buildAccountExport();

    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[0]).toMatchObject({
      id: 'sess-current',
      ipAddress: '10.0.0.1',
      userAgent: 'Chrome/120',
      createdAt: '2025-05-01T00:00:00.000Z',
      expiresAt: '2025-06-01T00:00:00.000Z',
      isCurrent: true,
    });
    expect(result.sessions[1]).toMatchObject({
      id: 'sess-other',
      ipAddress: '10.0.0.2',
      userAgent: 'Firefox/115',
      isCurrent: false,
    });
    expect(typeof result.sessions[1].createdAt).toBe('string');
    expect(typeof result.sessions[1].expiresAt).toBe('string');
  });

  it('sets session metadata fields to null when unavailable', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { id: 'sess-1' },
        user: { email: 'u@u.com', emailVerified: false },
      },
    });
    mockListAccounts.mockResolvedValue({ data: [] });
    mockListSessions.mockResolvedValue({
      data: [{ id: 'sess-1', token: 'tok-x' }],
    });

    const result = await buildAccountExport();

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]).toEqual({
      id: 'sess-1',
      ipAddress: null,
      userAgent: null,
      createdAt: null,
      expiresAt: null,
      isCurrent: true,
    });
  });

  it('does not include session token in export', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { id: 'sess-1' },
        user: { email: 'u@u.com', emailVerified: false },
      },
    });
    mockListAccounts.mockResolvedValue({ data: [] });
    mockListSessions.mockResolvedValue({
      data: [{ id: 'sess-1', token: 'super-secret-token' }],
    });

    const result = await buildAccountExport();

    expect(result.sessions[0]).not.toHaveProperty('token');
    const json = JSON.stringify(result);
    expect(json).not.toContain('super-secret-token');
  });

  it('returns empty sessions array when listSessions returns unexpected shape', async () => {
    mockGetSession.mockResolvedValue({
      data: { user: { email: 'u@u.com', emailVerified: false } },
    });
    mockListAccounts.mockResolvedValue({ data: [] });
    mockListSessions.mockResolvedValue({ data: null });

    const result = await buildAccountExport();
    expect(result.sessions).toEqual([]);
  });
});

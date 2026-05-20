import { Toast } from '@heroui/react';
import { I18nProvider } from '@lingui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
  type RouteObject,
} from 'react-router';
import { TopBarActionsProvider } from 'src/app-shell/top-bar-actions';
import { AuthContext } from 'src/auth/auth-context';
import type { Book } from 'src/books/book-schema';
import { DocContext, YArray, YDoc, YMap } from 'src/crdt';
import { SyncMetadataProvider } from 'src/crdt/sync-metadata-provider';
import type { BookMapData, TypedDoc } from 'src/crdt/typed-doc';
import type { EntityProfile } from 'src/entity-profiles/entity-profile-schema';
import type { KpoEntry } from 'src/entries/entries-schema';
import { i18n } from 'src/i18n/i18n';
import { LocaleProvider } from 'src/i18n/locale-provider';
import type { Signature } from 'src/signatures/signature-schema';

export const TEST_BOOK_ID = '00000000-0000-4000-8000-000000000000';
const TEST_BOOK_YEAR = 2025;
const TEST_CREATED_AT = '2025-01-01T00:00:00.000Z';
const TEST_USER_ID = 'test-user';

let testDoc: TypedDoc | undefined;

export function getTestDoc(): TypedDoc {
  if (!testDoc) {
    testDoc = new YDoc();
    bootstrapTestDoc(testDoc);
  }
  return testDoc;
}

export function resetTestDoc(): TypedDoc {
  testDoc = new YDoc();
  bootstrapTestDoc(testDoc);
  return testDoc;
}

function bootstrapTestDoc(doc: TypedDoc): void {
  const meta = doc.getMap('meta');
  if (!meta.has('schemaVersion')) {
    doc.transact(() => {
      meta.set('schemaVersion', 1);
    });
  }
  const user = doc.getMap('user');
  if (!user.has('locale')) {
    doc.transact(() => {
      user.set('locale', 'sr-Latn');
    });
  }
}

function seedYBook(
  doc: TypedDoc,
  id: string,
  patch: Partial<Omit<Book, 'id'>> = {},
): Book {
  const booksMap = doc.getMap('books');
  let yBook = booksMap.get(id);

  const year = yBook?.get('year') ?? patch.year ?? TEST_BOOK_YEAR;
  const createdAt =
    yBook?.get('createdAt') ?? patch.createdAt ?? TEST_CREATED_AT;
  const favorite = yBook?.get('favorite') ?? patch.favorite ?? false;

  if (!yBook) {
    yBook = new YMap<BookMapData>();
    doc.transact(() => {
      yBook!.set('id', id);
      yBook!.set('year', year);
      yBook!.set('createdAt', createdAt);
      yBook!.set('favorite', favorite);
      yBook!.set('entries', new YArray<KpoEntry>());
      booksMap.set(id, yBook!);
    });
  }

  if (patch.profile) {
    let yProfile = yBook.get('profile');
    if (!yProfile) {
      yProfile = new YMap<EntityProfile>();
      doc.transact(() => {
        yBook.set('profile', yProfile);
      });
    }
    doc.transact(() => {
      yProfile.set('pib', patch.profile!.pib);
      yProfile.set('obveznik', patch.profile!.obveznik);
      yProfile.set('firmaRadnje', patch.profile!.firmaRadnje);
      yProfile.set('sediste', patch.profile!.sediste);
      yProfile.set(
        'sifraPoreskogObveznika',
        patch.profile!.sifraPoreskogObveznika,
      );
      yProfile.set('sifraDelatnosti', patch.profile!.sifraDelatnosti);
    });
  }

  if (patch.signature) {
    let ySignature = yBook.get('signature');
    if (!ySignature) {
      ySignature = new YMap<Signature>();
      doc.transact(() => {
        yBook.set('signature', ySignature);
      });
    }
    doc.transact(() => {
      ySignature.set('sastavioIme', patch.signature!.sastavioIme);
      ySignature.set('odgovornoLiceIme', patch.signature!.odgovornoLiceIme);
    });
  }

  if (patch.entries && patch.entries.length > 0) {
    const yEntries = yBook.get('entries') ?? new YArray<KpoEntry>();
    const entriesToSeed = patch.entries;
    doc.transact(() => {
      for (const entry of entriesToSeed) {
        const yEntry = new YMap<KpoEntry>();
        yEntry.set('id', entry.id);
        yEntry.set('datumPrometa', entry.datumPrometa);
        yEntry.set('opisPrometa', entry.opisPrometa);
        yEntry.set('odProdajeProizvoda', entry.odProdajeProizvoda);
        yEntry.set('odIzvrsenihUsluga', entry.odIzvrsenihUsluga);
        yEntries.push([yEntry]);
      }
    });
  }

  return {
    id,
    year,
    createdAt,
    favorite,
    profile: patch.profile ?? yBook.get('profile')?.toJSON() ?? null,
    signature: patch.signature ?? yBook.get('signature')?.toJSON() ?? null,
    entries: patch.entries ?? [],
  };
}

export function mergeTestBook(patch: Partial<Omit<Book, 'id'>> = {}): Book {
  return seedYBook(getTestDoc(), TEST_BOOK_ID, patch);
}

export function seedProfile(profile: EntityProfile): void {
  mergeTestBook({ profile });
}

export function seedSignature(signature: Signature): void {
  mergeTestBook({ signature });
}

export function seedEntries(entries: KpoEntry[]): void {
  mergeTestBook({ entries });
}

export function seedBook(
  id: string,
  patch: Partial<Omit<Book, 'id'>> = {},
): Book {
  return seedYBook(getTestDoc(), id, patch);
}

/** Alias for {@link getTestBookProfile} — used by tests that seed then read back. */
export const getSeededProfile = getTestBookProfile;
/** Alias for {@link getTestBookSignature} — used by tests that seed then read back. */
export const getSeededSignature = getTestBookSignature;
/** Alias for {@link getTestBookEntries} — used by tests that seed then read back. */
export const getSeededEntries = getTestBookEntries;

export function getTestBookProfile(): EntityProfile | null {
  const doc = getTestDoc();
  return (
    doc.getMap('books').get(TEST_BOOK_ID)?.get('profile')?.toJSON() ?? null
  );
}

export function getTestBookSignature(): Signature | null {
  const doc = getTestDoc();
  return (
    doc.getMap('books').get(TEST_BOOK_ID)?.get('signature')?.toJSON() ?? null
  );
}

export function getTestBookEntries(): KpoEntry[] {
  const doc = getTestDoc();
  const yBook = doc.getMap('books').get(TEST_BOOK_ID);
  if (!yBook) return [];
  return (yBook.get('entries') ?? new YArray<KpoEntry>())
    .toArray()
    .map((e) => e.toJSON());
}

export function LocationDisplay() {
  const location = useLocation();
  return <span aria-label="current-location">{location.pathname}</span>;
}

export function I18nWrapper({ children }: { children: ReactNode }) {
  return (
    <I18nProvider i18n={i18n}>
      <LocaleProvider>{children}</LocaleProvider>
    </I18nProvider>
  );
}

export async function renderWithProviders(
  ui: ReactNode,
  options: { bookId?: string; route?: string; routes?: RouteObject[] } = {},
) {
  const bookId = options.bookId ?? TEST_BOOK_ID;
  const route = options.route ?? `/books/${bookId}`;
  const doc = getTestDoc();
  if (bookId === TEST_BOOK_ID) seedYBook(doc, TEST_BOOK_ID);

  const router = createMemoryRouter(
    options.routes ?? [
      { path: '/books/:bookId/*', element: <>{ui}</> },
      { path: '*', element: <>{ui}</> },
    ],
    { initialEntries: [route] },
  );

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  localStorage.setItem('autokpo:locale', 'sr-Latn');

  let result: ReturnType<typeof render>;
  // eslint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => {
    result = render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider i18n={i18n}>
          <DocContext value={doc}>
            <SyncMetadataProvider userId={TEST_USER_ID}>
              <LocaleProvider>
                <AuthContext
                  value={{
                    user: {
                      id: TEST_USER_ID,
                      email: 'test@example.com',
                      image: null,
                    },
                    refresh: () => Promise.resolve(TEST_USER_ID),
                    logout: () => Promise.resolve(),
                  }}
                >
                  <TopBarActionsProvider>
                    <Toast.Provider />
                    <RouterProvider router={router} />
                  </TopBarActionsProvider>
                </AuthContext>
              </LocaleProvider>
            </SyncMetadataProvider>
          </DocContext>
        </I18nProvider>
      </QueryClientProvider>,
    );
    await Promise.resolve();
  });
  return result!;
}

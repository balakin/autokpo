import { YArray, YMap } from '../crdt';
import type { TypedDoc, BookMapData } from '../crdt/typed-doc';
import type { KpoEntry } from '../entries/entries-schema';

import type { Book } from './book-schema';

function create(doc: TypedDoc, year: number): Book {
  const booksMap = doc.getMap('books');
  const yearExists = Array.from(booksMap.values()).some(
    (v) => v.get('year') === year,
  );
  if (yearExists) {
    throw new Error(`Book for year ${year} already exists`);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const book: Book = {
    id,
    year,
    createdAt: now,
    favorite: false,
    profile: null,
    signature: null,
    entries: [],
  };

  doc.transact(() => {
    const yBook = new YMap<BookMapData>();
    yBook.set('id', id);
    yBook.set('year', year);
    yBook.set('createdAt', now);
    yBook.set('favorite', false);
    yBook.set('entries', new YArray<KpoEntry>());
    booksMap.set(id, yBook);
  });

  return book;
}

function remove(doc: TypedDoc, id: string): void {
  doc.transact(() => {
    doc.getMap('books').delete(id);
  });
}

function update(
  doc: TypedDoc,
  id: string,
  patch: Partial<Pick<Book, 'favorite' | 'year'>>,
): void {
  doc.transact(() => {
    const yBook = doc.getMap('books').get(id);
    if (!yBook) return;
    if (patch.favorite !== undefined) {
      yBook.set('favorite', patch.favorite);
    }
    if (patch.year !== undefined) {
      yBook.set('year', patch.year);
    }
  });
}

export const bookMutations = {
  create,
  remove,
  update,
};

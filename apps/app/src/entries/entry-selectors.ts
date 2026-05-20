import type { TypedDoc } from '../crdt/typed-doc';

import type { KpoEntry } from './entries-schema';

function all(doc: TypedDoc, bookId: string): KpoEntry[] {
  const yBook = doc.getMap('books').get(bookId);
  if (!yBook?.has('entries')) return [];
  const yEntries = yBook.get('entries')!;
  return yEntries.toArray().map((e) => e.toJSON());
}

export const entrySelectors = {
  all: (bookId: string) => (doc: TypedDoc) => all(doc, bookId),
};

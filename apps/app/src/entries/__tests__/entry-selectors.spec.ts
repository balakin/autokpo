import { VALID_ENTRY, VALID_ENTRY_2 } from 'tests/fixtures/entry';
import { describe, expect, it } from 'vitest';

import { YArray, YDoc, YMap } from '../../crdt';
import type { BookMapData, TypedDoc } from '../../crdt/typed-doc';
import { entrySelectors } from '../entry-selectors';

const TEST_BOOK_ID = '00000000-0000-4000-8000-000000000000';

function createTestDoc(): TypedDoc {
  const doc = new YDoc();
  const yBook = new YMap<BookMapData>();
  doc.transact(() => {
    yBook.set('id', TEST_BOOK_ID);
    yBook.set('year', 2025);
    yBook.set('createdAt', '2025-01-01T00:00:00.000Z');
    yBook.set('favorite', false);
    yBook.set('entries', new YArray());
    doc.getMap('books').set(TEST_BOOK_ID, yBook);
  });
  return doc;
}

describe('entrySelectors', () => {
  describe('all', () => {
    it('returns an empty array when the book has no entries', () => {
      const doc = createTestDoc();
      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([]);
    });

    it('returns an empty array when the book does not exist', () => {
      const doc = new YDoc();
      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([]);
    });

    it('returns entries when they exist', () => {
      const doc = createTestDoc();
      const yBook = doc.getMap('books').get(TEST_BOOK_ID)!;
      const yEntries = yBook.get('entries')!;
      const yEntry = new YMap<typeof VALID_ENTRY>();
      doc.transact(() => {
        yEntry.set('id', VALID_ENTRY.id);
        yEntry.set('datumPrometa', VALID_ENTRY.datumPrometa);
        yEntry.set('opisPrometa', VALID_ENTRY.opisPrometa);
        yEntry.set('odProdajeProizvoda', VALID_ENTRY.odProdajeProizvoda);
        yEntry.set('odIzvrsenihUsluga', VALID_ENTRY.odIzvrsenihUsluga);
        yEntries.push([yEntry]);
      });

      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([VALID_ENTRY]);
    });

    it('returns multiple entries in order', () => {
      const doc = createTestDoc();
      const yBook = doc.getMap('books').get(TEST_BOOK_ID)!;
      const yEntries = yBook.get('entries')!;
      const yEntry1 = new YMap<typeof VALID_ENTRY>();
      const yEntry2 = new YMap<typeof VALID_ENTRY>();
      doc.transact(() => {
        yEntry1.set('id', VALID_ENTRY.id);
        yEntry1.set('datumPrometa', VALID_ENTRY.datumPrometa);
        yEntry1.set('opisPrometa', VALID_ENTRY.opisPrometa);
        yEntry1.set('odProdajeProizvoda', VALID_ENTRY.odProdajeProizvoda);
        yEntry1.set('odIzvrsenihUsluga', VALID_ENTRY.odIzvrsenihUsluga);
        yEntry2.set('id', VALID_ENTRY_2.id);
        yEntry2.set('datumPrometa', VALID_ENTRY_2.datumPrometa);
        yEntry2.set('opisPrometa', VALID_ENTRY_2.opisPrometa);
        yEntry2.set('odProdajeProizvoda', VALID_ENTRY_2.odProdajeProizvoda);
        yEntry2.set('odIzvrsenihUsluga', VALID_ENTRY_2.odIzvrsenihUsluga);
        yEntries.push([yEntry1, yEntry2]);
      });

      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([
        VALID_ENTRY,
        VALID_ENTRY_2,
      ]);
    });
  });
});

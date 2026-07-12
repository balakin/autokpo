import { VALID_ENTRY, VALID_ENTRY_2 } from 'tests/fixtures/entry';
import { describe, expect, it } from 'vitest';

import { YArray, YDoc, YMap } from '../../crdt';
import type { BookMapData, TypedDoc } from '../../crdt/typed-doc';
import { entrySelectors } from '../entry-selectors';

const TEST_BOOK_ID = '00000000-0000-4000-8000-000000000000';
const TEST_BOOK_ID_2 = '00000000-0000-4000-8000-000000000010';

function createTestDoc(): TypedDoc {
  const doc = new YDoc();
  addBook(doc, TEST_BOOK_ID, 2025);
  return doc;
}

function addBook(doc: TypedDoc, bookId: string, year: number): void {
  const yBook = new YMap<BookMapData>();
  doc.transact(() => {
    yBook.set('id', bookId);
    yBook.set('year', year);
    yBook.set('createdAt', '2025-01-01T00:00:00.000Z');
    yBook.set('favorite', false);
    yBook.set('entries', new YArray());
    doc.getMap('books').set(bookId, yBook);
  });
}

function createEntry(
  id: string,
  opisPrometa: string,
  datumPrometa: string,
): typeof VALID_ENTRY {
  return {
    ...VALID_ENTRY,
    id,
    datumPrometa,
    opisPrometa,
  };
}

function seedEntries(
  doc: TypedDoc,
  bookId: string,
  entries: Array<typeof VALID_ENTRY>,
): void {
  const yEntries = doc.getMap('books').get(bookId)!.get('entries')!;
  doc.transact(() => {
    for (const entry of entries) {
      const yEntry = new YMap<typeof VALID_ENTRY>();
      yEntry.set('id', entry.id);
      yEntry.set('datumPrometa', entry.datumPrometa);
      yEntry.set('opisPrometa', entry.opisPrometa);
      yEntry.set('odProdajeProizvoda', entry.odProdajeProizvoda);
      yEntry.set('odIzvrsenihUsluga', entry.odIzvrsenihUsluga);
      yEntries.push([yEntry]);
    }
  });
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

  describe('descriptionSuggestions', () => {
    it('returns an empty array when the document has no entries', () => {
      expect(entrySelectors.descriptionSuggestions()(new YDoc())).toEqual([]);
    });

    it('collects descriptions across multiple books', () => {
      const doc = createTestDoc();
      addBook(doc, TEST_BOOK_ID_2, 2024);
      seedEntries(doc, TEST_BOOK_ID, [
        createEntry(
          '00000000-0000-4000-8000-000000000011',
          'Tekuca knjiga',
          '2025-01-15',
        ),
      ]);
      seedEntries(doc, TEST_BOOK_ID_2, [
        createEntry(
          '00000000-0000-4000-8000-000000000012',
          'Prethodna knjiga',
          '2024-12-15',
        ),
      ]);

      expect(entrySelectors.descriptionSuggestions()(doc)).toEqual([
        'Tekuca knjiga',
        'Prethodna knjiga',
      ]);
    });

    it('sorts more frequent descriptions before less frequent recent ones', () => {
      const doc = createTestDoc();
      seedEntries(doc, TEST_BOOK_ID, [
        createEntry(
          '00000000-0000-4000-8000-000000000021',
          'Konsultacije',
          '2025-01-01',
        ),
        createEntry(
          '00000000-0000-4000-8000-000000000022',
          'Konsultacije',
          '2025-01-02',
        ),
        createEntry(
          '00000000-0000-4000-8000-000000000023',
          'Skorasnji jednokratni opis',
          '2025-12-31',
        ),
      ]);

      expect(entrySelectors.descriptionSuggestions()(doc)).toEqual([
        'Konsultacije',
        'Skorasnji jednokratni opis',
      ]);
    });

    it('uses recency as the frequency tiebreak', () => {
      const doc = createTestDoc();
      seedEntries(doc, TEST_BOOK_ID, [
        createEntry(
          '00000000-0000-4000-8000-000000000031',
          'Stariji opis',
          '2025-01-01',
        ),
        createEntry(
          '00000000-0000-4000-8000-000000000032',
          'Noviji opis',
          '2025-03-01',
        ),
      ]);

      expect(entrySelectors.descriptionSuggestions()(doc)).toEqual([
        'Noviji opis',
        'Stariji opis',
      ]);
    });

    it('collapses case and whitespace variants while keeping the most recent spelling', () => {
      const doc = createTestDoc();
      seedEntries(doc, TEST_BOOK_ID, [
        createEntry(
          '00000000-0000-4000-8000-000000000041',
          'Konsultacije',
          '2025-01-01',
        ),
        createEntry(
          '00000000-0000-4000-8000-000000000042',
          'Drugo',
          '2025-01-02',
        ),
        createEntry(
          '00000000-0000-4000-8000-000000000043',
          'konsultacije',
          '2025-02-01',
        ),
        createEntry(
          '00000000-0000-4000-8000-000000000044',
          'Drugo',
          '2025-02-02',
        ),
        createEntry(
          '00000000-0000-4000-8000-000000000045',
          'Konsultacije ',
          '2025-03-01',
        ),
      ]);

      expect(entrySelectors.descriptionSuggestions()(doc)).toEqual([
        'Konsultacije ',
        'Drugo',
      ]);
    });
  });
});

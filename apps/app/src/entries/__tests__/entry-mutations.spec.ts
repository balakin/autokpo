import { VALID_ENTRY, VALID_ENTRY_2 } from 'tests/fixtures/entry';
import { describe, expect, it } from 'vitest';

import { YArray, YDoc, YMap } from '../../crdt';
import type { BookMapData, TypedDoc } from '../../crdt/typed-doc';
import { entryMutations } from '../entry-mutations';
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

describe('entryMutations', () => {
  describe('add', () => {
    it('creates entries and adds the first entry', () => {
      const doc = createTestDoc();
      entryMutations.add(doc, TEST_BOOK_ID, VALID_ENTRY);
      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([VALID_ENTRY]);
    });

    it('appends a second entry', () => {
      const doc = createTestDoc();
      entryMutations.add(doc, TEST_BOOK_ID, VALID_ENTRY);
      entryMutations.add(doc, TEST_BOOK_ID, VALID_ENTRY_2);
      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([
        VALID_ENTRY,
        VALID_ENTRY_2,
      ]);
    });

    it('is a no-op when the book does not exist', () => {
      const doc = new YDoc();
      entryMutations.add(doc, TEST_BOOK_ID, VALID_ENTRY);
      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([]);
    });
  });

  describe('update', () => {
    it('modifies an existing entry', () => {
      const doc = createTestDoc();
      entryMutations.add(doc, TEST_BOOK_ID, VALID_ENTRY);
      const updated = { ...VALID_ENTRY, opisPrometa: 'Updated description' };
      entryMutations.update(doc, TEST_BOOK_ID, updated);
      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([updated]);
    });

    it('is a no-op when the entry does not exist', () => {
      const doc = createTestDoc();
      entryMutations.add(doc, TEST_BOOK_ID, VALID_ENTRY);
      entryMutations.update(doc, TEST_BOOK_ID, VALID_ENTRY_2);
      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([VALID_ENTRY]);
    });

    it('is a no-op when the book does not exist', () => {
      const doc = new YDoc();
      entryMutations.update(doc, TEST_BOOK_ID, VALID_ENTRY);
      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([]);
    });
  });

  describe('remove', () => {
    it('deletes an existing entry', () => {
      const doc = createTestDoc();
      entryMutations.add(doc, TEST_BOOK_ID, VALID_ENTRY);
      entryMutations.remove(doc, TEST_BOOK_ID, VALID_ENTRY.id);
      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([]);
    });

    it('is a no-op when the entry does not exist', () => {
      const doc = createTestDoc();
      entryMutations.add(doc, TEST_BOOK_ID, VALID_ENTRY);
      entryMutations.remove(doc, TEST_BOOK_ID, VALID_ENTRY_2.id);
      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([VALID_ENTRY]);
    });

    it('is a no-op when the book does not exist', () => {
      const doc = new YDoc();
      entryMutations.remove(doc, TEST_BOOK_ID, VALID_ENTRY.id);
      expect(entrySelectors.all(TEST_BOOK_ID)(doc)).toEqual([]);
    });
  });
});

import { VALID_SIGNATURE } from 'tests/fixtures/signature';
import { describe, expect, it } from 'vitest';

import { YDoc, YMap } from '../../crdt';
import type { BookMapData, TypedDoc } from '../../crdt/typed-doc';
import { signatureMutations } from '../signature-mutations';
import { signatureSelectors } from '../signature-selectors';

const TEST_BOOK_ID = '00000000-0000-4000-8000-000000000000';

function createTestDoc(): TypedDoc {
  const doc = new YDoc();
  const yBook = new YMap<BookMapData>();
  doc.transact(() => {
    yBook.set('id', TEST_BOOK_ID);
    yBook.set('year', 2025);
    yBook.set('createdAt', '2025-01-01T00:00:00.000Z');
    yBook.set('favorite', false);
    doc.getMap('books').set(TEST_BOOK_ID, yBook);
  });
  return doc;
}

describe('signatureMutations', () => {
  describe('save', () => {
    it('creates and saves a signature', () => {
      const doc = createTestDoc();
      signatureMutations.save(doc, TEST_BOOK_ID, VALID_SIGNATURE);
      expect(signatureSelectors.active(TEST_BOOK_ID)(doc)).toEqual(
        VALID_SIGNATURE,
      );
    });

    it('updates an existing signature', () => {
      const doc = createTestDoc();
      signatureMutations.save(doc, TEST_BOOK_ID, VALID_SIGNATURE);
      const updated = {
        sastavioIme: 'Novo Ime',
        odgovornoLiceIme: VALID_SIGNATURE.odgovornoLiceIme,
      };
      signatureMutations.save(doc, TEST_BOOK_ID, updated);
      expect(signatureSelectors.active(TEST_BOOK_ID)(doc)).toEqual(updated);
    });

    it('is a no-op when the book does not exist', () => {
      const doc = new YDoc();
      signatureMutations.save(doc, TEST_BOOK_ID, VALID_SIGNATURE);
      expect(signatureSelectors.active(TEST_BOOK_ID)(doc)).toBeNull();
    });
  });
});

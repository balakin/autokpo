import { VALID_SIGNATURE } from 'tests/fixtures/signature';
import { describe, expect, it } from 'vitest';

import { YDoc, YMap } from '../../crdt';
import type { BookMapData, TypedDoc } from '../../crdt/typed-doc';
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

describe('signatureSelectors', () => {
  describe('active', () => {
    it('returns null when the book has no signature', () => {
      const doc = createTestDoc();
      expect(signatureSelectors.active(TEST_BOOK_ID)(doc)).toBeNull();
    });

    it('returns null when the book does not exist', () => {
      const doc = new YDoc();
      expect(signatureSelectors.active(TEST_BOOK_ID)(doc)).toBeNull();
    });

    it('returns the signature when it exists', () => {
      const doc = createTestDoc();
      const yBook = doc.getMap('books').get(TEST_BOOK_ID)!;
      const ySignature = new YMap<typeof VALID_SIGNATURE>();
      doc.transact(() => {
        ySignature.set('sastavioIme', VALID_SIGNATURE.sastavioIme);
        ySignature.set('odgovornoLiceIme', VALID_SIGNATURE.odgovornoLiceIme);
        yBook.set('signature', ySignature);
      });

      expect(signatureSelectors.active(TEST_BOOK_ID)(doc)).toEqual(
        VALID_SIGNATURE,
      );
    });
  });
});

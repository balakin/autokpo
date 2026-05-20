import { VALID_PROFILE } from 'tests/fixtures/entity-profile';
import { describe, expect, it } from 'vitest';

import { YDoc, YMap } from '../../crdt';
import type { BookMapData, TypedDoc } from '../../crdt/typed-doc';
import { profileMutations } from '../profile-mutations';
import { profileSelectors } from '../profile-selectors';

function createTestDoc(): TypedDoc {
  return new YDoc();
}

describe('profileMutations', () => {
  describe('save', () => {
    it('creates and saves a profile', () => {
      const doc = createTestDoc();
      const bookId = 'book-a';
      doc.transact(() => {
        doc.getMap('books').set(bookId, new YMap<BookMapData>());
      });

      profileMutations.save(doc, bookId, VALID_PROFILE);

      expect(profileSelectors.active(bookId)(doc)).toEqual(VALID_PROFILE);
    });

    it('updates an existing profile', () => {
      const doc = createTestDoc();
      const bookId = 'book-a';
      doc.transact(() => {
        doc.getMap('books').set(bookId, new YMap<BookMapData>());
      });

      profileMutations.save(doc, bookId, VALID_PROFILE);
      const updated = { ...VALID_PROFILE, obveznik: 'Updated Obveznik' };
      profileMutations.save(doc, bookId, updated);

      expect(profileSelectors.active(bookId)(doc)).toEqual(updated);
    });

    it('keeps profiles isolated between books', () => {
      const doc = createTestDoc();
      doc.transact(() => {
        doc.getMap('books').set('book-a', new YMap<BookMapData>());
        doc.getMap('books').set('book-b', new YMap<BookMapData>());
      });

      profileMutations.save(doc, 'book-a', VALID_PROFILE);

      expect(profileSelectors.active('book-a')(doc)).toEqual(VALID_PROFILE);
      expect(profileSelectors.active('book-b')(doc)).toBeNull();
    });

    it('is a no-op when the book does not exist', () => {
      const doc = createTestDoc();
      profileMutations.save(doc, 'book-a', VALID_PROFILE);
      expect(profileSelectors.active('book-a')(doc)).toBeNull();
    });
  });
});

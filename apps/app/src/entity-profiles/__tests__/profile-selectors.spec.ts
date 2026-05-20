import { VALID_PROFILE } from 'tests/fixtures/entity-profile';
import { describe, expect, it } from 'vitest';

import { YDoc, YMap } from '../../crdt';
import type { BookMapData, TypedDoc } from '../../crdt/typed-doc';
import { profileSelectors } from '../profile-selectors';

function createTestDoc(): TypedDoc {
  return new YDoc();
}

describe('profileSelectors', () => {
  describe('active', () => {
    it('returns null when the book does not exist', () => {
      const doc = createTestDoc();
      expect(profileSelectors.active('book-a')(doc)).toBeNull();
    });

    it('returns null when the book has no profile', () => {
      const doc = createTestDoc();
      doc.transact(() => {
        doc.getMap('books').set('book-a', new YMap<BookMapData>());
      });
      expect(profileSelectors.active('book-a')(doc)).toBeNull();
    });

    it('returns the profile when it exists', () => {
      const doc = createTestDoc();
      const bookId = 'book-a';
      doc.transact(() => {
        const yBook = new YMap<BookMapData>();
        const yProfile = new YMap<typeof VALID_PROFILE>();
        yProfile.set('pib', VALID_PROFILE.pib);
        yProfile.set('obveznik', VALID_PROFILE.obveznik);
        yProfile.set('firmaRadnje', VALID_PROFILE.firmaRadnje);
        yProfile.set('sediste', VALID_PROFILE.sediste);
        yProfile.set(
          'sifraPoreskogObveznika',
          VALID_PROFILE.sifraPoreskogObveznika,
        );
        yProfile.set('sifraDelatnosti', VALID_PROFILE.sifraDelatnosti);
        yBook.set('profile', yProfile);
        doc.getMap('books').set(bookId, yBook);
      });

      expect(profileSelectors.active(bookId)(doc)).toEqual(VALID_PROFILE);
    });
  });
});

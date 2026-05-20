import { BOOK_ID_1 } from 'tests/fixtures/book';
import { getTestDoc, resetTestDoc, seedBook } from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { bookMutations } from '../book-mutations';
import { bookSelectors } from '../book-selectors';

describe('bookMutations', () => {
  beforeEach(() => {
    resetTestDoc();
  });

  it('creates a book and prevents duplicate year', () => {
    const doc = getTestDoc();
    const created = bookMutations.create(doc, 2024);
    expect(created.year).toBe(2024);
    expect(bookSelectors.occupiedYears()(doc)).toEqual([2024]);

    expect(() => bookMutations.create(doc, 2024)).toThrow(
      'Book for year 2024 already exists',
    );
  });

  it('updates and removes book state', () => {
    const doc = getTestDoc();
    seedBook(BOOK_ID_1, { year: 2025, favorite: false });

    bookMutations.update(doc, BOOK_ID_1, { favorite: true, year: 2026 });
    expect(bookSelectors.libraryRows()(doc)[0]).toMatchObject({
      id: BOOK_ID_1,
      favorite: true,
      year: 2026,
    });

    bookMutations.remove(doc, BOOK_ID_1);
    expect(bookSelectors.libraryRows()(doc)).toEqual([]);
  });
});

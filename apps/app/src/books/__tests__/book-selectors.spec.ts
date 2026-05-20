import { BOOK_ID_1, BOOK_ID_2 } from 'tests/fixtures/book';
import { VALID_PROFILE } from 'tests/fixtures/entity-profile';
import { VALID_SIGNATURE } from 'tests/fixtures/signature';
import { resetTestDoc, seedBook } from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { bookSelectors } from '../book-selectors';

describe('bookSelectors', () => {
  beforeEach(() => {
    resetTestDoc();
  });

  it('returns null route state for unknown id', () => {
    const doc = resetTestDoc();
    expect(bookSelectors.routeState('unknown')(doc)).toBeNull();
  });

  it('returns route state for known id', () => {
    const doc = resetTestDoc();
    seedBook(BOOK_ID_1, { profile: VALID_PROFILE, signature: VALID_SIGNATURE });
    expect(bookSelectors.routeState(BOOK_ID_1)(doc)).toEqual({
      id: BOOK_ID_1,
      year: 2025,
      hasProfile: true,
      hasSignature: true,
    });
  });

  it('builds library rows newest-first with income and completion state', () => {
    const doc = resetTestDoc();
    seedBook(BOOK_ID_1, {
      year: 2024,
      entries: [
        {
          id: '00000000-0000-4000-8000-000000000111',
          datumPrometa: '2024-02-01',
          opisPrometa: 'A',
          odProdajeProizvoda: 100,
          odIzvrsenihUsluga: 200,
        },
      ],
    });
    seedBook(BOOK_ID_2, {
      year: 2025,
      favorite: true,
      profile: VALID_PROFILE,
      signature: VALID_SIGNATURE,
    });

    expect(bookSelectors.libraryRows()(doc)).toEqual([
      {
        id: BOOK_ID_2,
        year: 2025,
        favorite: true,
        entryCount: 0,
        income: 0,
        incomplete: false,
        isDuplicateYear: false,
      },
      {
        id: BOOK_ID_1,
        year: 2024,
        favorite: false,
        entryCount: 1,
        income: 300,
        incomplete: true,
        isDuplicateYear: false,
      },
    ]);
  });

  it('marks duplicate rows and returns duplicate year summary', () => {
    const doc = resetTestDoc();
    seedBook(BOOK_ID_1, { year: 2026 });
    seedBook(BOOK_ID_2, { year: 2026 });

    expect(bookSelectors.libraryRows()(doc)).toEqual([
      expect.objectContaining({
        id: BOOK_ID_1,
        year: 2026,
        isDuplicateYear: true,
      }),
      expect.objectContaining({
        id: BOOK_ID_2,
        year: 2026,
        isDuplicateYear: true,
      }),
    ]);

    expect(bookSelectors.duplicateYearSummary()(doc)).toEqual([
      { year: 2026, count: 2 },
    ]);
  });

  it('returns summary for multiple duplicated years sorted newest-first', () => {
    const doc = resetTestDoc();
    seedBook('00000000-0000-4000-8000-000000000101', { year: 2024 });
    seedBook('00000000-0000-4000-8000-000000000102', { year: 2024 });
    seedBook('00000000-0000-4000-8000-000000000103', { year: 2024 });
    seedBook('00000000-0000-4000-8000-000000000104', { year: 2026 });
    seedBook('00000000-0000-4000-8000-000000000105', { year: 2026 });

    expect(bookSelectors.duplicateYearSummary()(doc)).toEqual([
      { year: 2026, count: 2 },
      { year: 2024, count: 3 },
    ]);
  });

  it('returns no duplicate summary and no duplicate row tags when all years are unique', () => {
    const doc = resetTestDoc();
    seedBook(BOOK_ID_1, { year: 2024 });
    seedBook(BOOK_ID_2, { year: 2025 });

    expect(bookSelectors.duplicateYearSummary()(doc)).toEqual([]);
    expect(bookSelectors.libraryRows()(doc)).toEqual([
      expect.objectContaining({ id: BOOK_ID_2, isDuplicateYear: false }),
      expect.objectContaining({ id: BOOK_ID_1, isDuplicateYear: false }),
    ]);
  });

  it('returns occupied years and favorites', () => {
    const doc = resetTestDoc();
    seedBook(BOOK_ID_1, { year: 2024, favorite: false });
    seedBook(BOOK_ID_2, { year: 2025, favorite: true });

    expect(bookSelectors.occupiedYears()(doc)).toEqual([2025, 2024]);
    expect(bookSelectors.favorites()(doc)).toEqual([
      { id: BOOK_ID_2, year: 2025 },
    ]);
  });
});

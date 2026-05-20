import type { Book } from 'src/books/book-schema';
import { describe, expect, it } from 'vitest';

import { computeStats } from '../compute';

const TODAY = new Date('2026-04-20');

function makeEntry(
  datumPrometa: string,
  odProdajeProizvoda = 0,
  odIzvrsenihUsluga = 0,
) {
  return {
    id: crypto.randomUUID(),
    datumPrometa,
    opisPrometa: 'Test',
    odProdajeProizvoda,
    odIzvrsenihUsluga,
  };
}

function makeBook(
  year: number,
  entries: ReturnType<typeof makeEntry>[] = [],
): Book {
  return {
    id: crypto.randomUUID(),
    year,
    profile: null,
    signature: null,
    entries,
    createdAt: `${year}-01-01T00:00:00.000Z`,
    favorite: false,
  };
}

describe('computeStats — empty books', () => {
  it('returns zero for all income fields and null for peaks', () => {
    const stats = computeStats([], TODAY);
    expect(stats.currentYearIncome).toBe(0);
    expect(stats.last12MonthsIncome).toBe(0);
    expect(stats.allTimeTotal).toBe(0);
    expect(stats.historicalPeakYear).toBeNull();
    expect(stats.historicalPeak12M).toBeNull();
  });

  it('provides last12MonthsWindow with correct dates', () => {
    const stats = computeStats([], TODAY);
    expect(stats.last12MonthsWindow.end).toBe(TODAY);
    // start should be 2025-04-20
    expect(stats.last12MonthsWindow.start.toISOString().slice(0, 10)).toBe(
      '2025-04-20',
    );
  });
});

describe('computeStats — currentYearIncome', () => {
  it('sums entries from the book matching today year', () => {
    const book = makeBook(2026, [
      makeEntry('2026-01-10', 500_000, 200_000),
      makeEntry('2026-03-15', 0, 300_000),
    ]);
    const stats = computeStats([book], TODAY);
    expect(stats.currentYearIncome).toBe(1_000_000);
  });

  it('returns 0 when no book matches today year', () => {
    const book = makeBook(2025, [makeEntry('2025-06-01', 1_000_000)]);
    const stats = computeStats([book], TODAY);
    expect(stats.currentYearIncome).toBe(0);
  });

  it('uses book.year, not entry datumPrometa year', () => {
    // Book for 2026 but entry has 2025 date — still counted for current year
    const book = makeBook(2026, [makeEntry('2025-12-31', 400_000)]);
    const stats = computeStats([book], TODAY);
    expect(stats.currentYearIncome).toBe(400_000);
  });
});

describe('computeStats — last12MonthsIncome', () => {
  it('includes entries from multiple books within the window', () => {
    const book2025 = makeBook(2025, [makeEntry('2025-06-01', 200_000)]);
    const book2026 = makeBook(2026, [makeEntry('2026-02-01', 300_000)]);
    const stats = computeStats([book2025, book2026], TODAY);
    // Both fall within 2025-04-20 to 2026-04-20
    expect(stats.last12MonthsIncome).toBe(500_000);
  });

  it('excludes entries before the 12M window', () => {
    const book = makeBook(2025, [
      makeEntry('2025-04-19', 1_000_000), // day before boundary — excluded
      makeEntry('2025-04-20', 500_000), // exactly on boundary — included
    ]);
    const stats = computeStats([book], TODAY);
    expect(stats.last12MonthsIncome).toBe(500_000);
  });

  it('includes entry exactly on the window start boundary', () => {
    const book = makeBook(2025, [makeEntry('2025-04-20', 750_000)]);
    const stats = computeStats([book], TODAY);
    expect(stats.last12MonthsIncome).toBe(750_000);
  });

  it('excludes entries after today', () => {
    const book = makeBook(2026, [makeEntry('2026-04-21', 999_000)]);
    const stats = computeStats([book], TODAY);
    expect(stats.last12MonthsIncome).toBe(0);
  });

  it('handles leap-day boundary in rolling window', () => {
    const leapToday = new Date('2025-02-28');
    const book = makeBook(2024, [
      makeEntry('2024-02-28', 500_000),
      makeEntry('2024-02-27', 200_000),
    ]);
    const stats = computeStats([book], leapToday);
    expect(stats.last12MonthsIncome).toBe(500_000);
  });

  it('keeps month-end inclusive behavior for 31st dates', () => {
    const marchEnd = new Date('2026-03-31');
    const book = makeBook(2025, [
      makeEntry('2025-03-31', 400_000),
      makeEntry('2025-03-30', 400_000),
    ]);
    const stats = computeStats([book], marchEnd);
    expect(stats.last12MonthsIncome).toBe(400_000);
  });
});

describe('computeStats — historicalPeakYear', () => {
  it('returns the single book when only one exists', () => {
    const book = makeBook(2024, [makeEntry('2024-06-01', 2_000_000)]);
    const stats = computeStats([book], TODAY);
    expect(stats.historicalPeakYear).toEqual({ year: 2024, income: 2_000_000 });
  });

  it('picks the book with the highest total', () => {
    const b2024 = makeBook(2024, [makeEntry('2024-01-01', 3_000_000)]);
    const b2025 = makeBook(2025, [makeEntry('2025-01-01', 5_000_000)]);
    const stats = computeStats([b2024, b2025], TODAY);
    expect(stats.historicalPeakYear?.year).toBe(2025);
  });

  it('picks the most recent year on tie', () => {
    const b2024 = makeBook(2024, [makeEntry('2024-01-01', 2_000_000)]);
    const b2025 = makeBook(2025, [makeEntry('2025-01-01', 2_000_000)]);
    const stats = computeStats([b2024, b2025], TODAY);
    expect(stats.historicalPeakYear?.year).toBe(2025);
  });
});

describe('computeStats — historicalPeak12M', () => {
  it('finds peak window spanning two books', () => {
    const b2024 = makeBook(2024, [
      makeEntry('2024-09-01', 2_000_000),
      makeEntry('2024-12-01', 2_000_000),
    ]);
    const b2025 = makeBook(2025, [makeEntry('2025-03-01', 2_000_000)]);
    const stats = computeStats([b2024, b2025], TODAY);
    // Peak window ends at 2025-03-01, includes all three entries = 6M
    expect(stats.historicalPeak12M?.income).toBe(6_000_000);
  });

  it('returns null when no entries exist', () => {
    const book = makeBook(2025);
    const stats = computeStats([book], TODAY);
    expect(stats.historicalPeak12M).toBeNull();
  });

  it('handles single entry', () => {
    const book = makeBook(2025, [makeEntry('2025-06-01', 1_500_000)]);
    const stats = computeStats([book], TODAY);
    expect(stats.historicalPeak12M?.income).toBe(1_500_000);
  });

  it('window end at 2025-01-15 excludes 2024-01-01 entry but keeps 12M window correct', () => {
    // At right=2024-01-01: window=[2023-01-01,2024-01-01], sum=5M → peakSum=5M
    // At right=2025-01-15: leftBound=2024-01-15, 2024-01-01 excluded, sum=1M
    // At right=2025-06-01: leftBound=2024-06-01, 2025-01-15 included, sum=2M
    // Peak = 5M (single old entry in its own 12M window)
    const book = makeBook(2025, [
      makeEntry('2024-01-01', 5_000_000),
      makeEntry('2025-01-15', 1_000_000),
      makeEntry('2025-06-01', 1_000_000),
    ]);
    const stats = computeStats([book], TODAY);
    expect(stats.historicalPeak12M?.income).toBe(5_000_000);
    expect(stats.historicalPeak12M?.window.end.toISOString().slice(0, 10)).toBe(
      '2024-01-01',
    );
  });

  it('peak window correctly uses boundary-inclusive dates', () => {
    // Entry exactly 12M before another: both should be in window
    const book = makeBook(2025, [
      makeEntry('2024-06-01', 3_000_000),
      makeEntry('2025-06-01', 3_000_000),
    ]);
    const stats = computeStats([book], TODAY);
    // At right=2025-06-01: leftBound=2024-06-01; 2024-06-01 >= 2024-06-01 → included
    expect(stats.historicalPeak12M?.income).toBe(6_000_000);
  });

  it('uses leap-aware month subtraction for peak window bounds', () => {
    const book = makeBook(2024, [
      makeEntry('2024-02-29', 4_000_000),
      makeEntry('2025-02-28', 4_000_000),
    ]);
    const stats = computeStats([book], TODAY);
    expect(stats.historicalPeak12M?.income).toBe(8_000_000);
  });
});

describe('computeStats — allTimeTotal', () => {
  it('sums across all books', () => {
    const b1 = makeBook(2024, [makeEntry('2024-01-01', 1_000_000)]);
    const b2 = makeBook(2025, [makeEntry('2025-01-01', 2_000_000)]);
    const stats = computeStats([b1, b2], TODAY);
    expect(stats.allTimeTotal).toBe(3_000_000);
  });

  it('sums both income fields per entry', () => {
    const book = makeBook(2025, [makeEntry('2025-01-01', 400_000, 600_000)]);
    const stats = computeStats([book], TODAY);
    expect(stats.allTimeTotal).toBe(1_000_000);
  });
});

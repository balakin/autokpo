import type { Book } from 'src/books/book-schema';
import { yAxisTickFormatter } from 'src/formatters';
import { renderWithProviders } from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import IncomeChart from '../income-chart';

function makeBook(year: number, income: number): Book {
  return {
    id: crypto.randomUUID(),
    year,
    profile: null,
    signature: null,
    entries:
      income > 0
        ? [
            {
              id: crypto.randomUUID(),
              datumPrometa: `${year}-06-01`,
              opisPrometa: 'Test',
              odProdajeProizvoda: income,
              odIzvrsenihUsluga: 0,
            },
          ]
        : [],
    createdAt: `${year}-01-01T00:00:00.000Z`,
    favorite: false,
  };
}

beforeEach(() => localStorage.clear());

describe('IncomeChart', () => {
  it('renders without crashing with no books', async () => {
    const { unmount } = await renderWithProviders(<IncomeChart books={[]} />);
    expect(() => unmount()).not.toThrow();
  });

  it('renders with books data', async () => {
    const books = [makeBook(2024, 2_000_000), makeBook(2025, 4_000_000)];
    const { unmount } = await renderWithProviders(
      <IncomeChart books={books} />,
    );
    expect(() => unmount()).not.toThrow();
  });
});

describe('yAxisTickFormatter', () => {
  it('returns raw integer formatter for max < 10K', () => {
    const fmt = yAxisTickFormatter(5_000);
    expect(fmt(0)).toBe('0');
    expect(fmt(2_500)).toBe('2500');
    expect(fmt(5_000)).toBe('5000');
  });

  it('returns K-suffix formatter for max between 10K and 1M', () => {
    const fmt = yAxisTickFormatter(500_000);
    expect(fmt(0)).toBe('0K');
    expect(fmt(100_000)).toBe('100K');
    expect(fmt(500_000)).toBe('500K');
  });

  it('returns M-suffix formatter for max >= 1M', () => {
    const fmt = yAxisTickFormatter(6_000_000);
    expect(fmt(0)).toBe('0.0M');
    expect(fmt(1_500_000)).toBe('1.5M');
    expect(fmt(6_000_000)).toBe('6.0M');
  });

  it('returns raw integer formatter for max of 0 (no data)', () => {
    const fmt = yAxisTickFormatter(0);
    expect(fmt(0)).toBe('0');
    expect(fmt(1)).toBe('1');
  });
});

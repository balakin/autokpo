import type { Book } from 'src/books/book-schema';
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

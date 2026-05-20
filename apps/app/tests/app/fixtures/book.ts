import type { Book } from 'src/books/book-schema';

export const BOOK_ID_1 = '00000000-0000-4000-8000-000000000001';
export const BOOK_ID_2 = '00000000-0000-4000-8000-000000000002';

export function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: BOOK_ID_1,
    year: 2025,
    profile: null,
    signature: null,
    entries: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    favorite: false,
    ...overrides,
  };
}

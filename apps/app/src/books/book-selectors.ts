import { yMapToBook } from '../crdt';
import type { TypedDoc } from '../crdt/typed-doc';

import type { Book } from './book-schema';

export interface BookRouteState {
  id: string;
  year: number;
  hasProfile: boolean;
  hasSignature: boolean;
}

export interface BookLibraryRow {
  id: string;
  year: number;
  favorite: boolean;
  entryCount: number;
  income: number;
  incomplete: boolean;
  isDuplicateYear: boolean;
}

export interface DuplicateYearSummary {
  year: number;
  count: number;
}

export interface FavoriteBookLink {
  id: string;
  year: number;
}

export interface StatsBookProjection {
  year: number;
  entries: Book['entries'];
}

function routeState(doc: TypedDoc, bookId: string): BookRouteState | null {
  const yBook = doc.getMap('books').get(bookId);
  if (!yBook) return null;
  return {
    id: yBook.get('id')!,
    year: yBook.get('year')!,
    hasProfile: !!yBook.get('profile'),
    hasSignature: !!yBook.get('signature'),
  };
}

function libraryRows(doc: TypedDoc): BookLibraryRow[] {
  const books = Array.from(doc.getMap('books').values()).map(yMapToBook);
  const duplicateYears = new Set(
    duplicateYearSummary(doc).map((item) => item.year),
  );

  return books
    .map((book) => ({
      id: book.id,
      year: book.year,
      favorite: book.favorite,
      entryCount: book.entries.length,
      income: book.entries.reduce(
        (sum, entry) =>
          sum + entry.odProdajeProizvoda + entry.odIzvrsenihUsluga,
        0,
      ),
      incomplete: book.profile === null || book.signature === null,
      isDuplicateYear: duplicateYears.has(book.year),
    }))
    .sort((a, b) => b.year - a.year);
}

function duplicateYearSummary(doc: TypedDoc): DuplicateYearSummary[] {
  const counts = new Map<number, number>();

  for (const yBook of doc.getMap('books').values()) {
    const year = yBook.get('year');
    if (year === undefined) continue;
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year - a.year);
}

function occupiedYears(doc: TypedDoc): number[] {
  return Array.from(doc.getMap('books').values())
    .map((book) => book.get('year')!)
    .sort((a, b) => b - a);
}

function breadcrumb(doc: TypedDoc, bookId: string): number | null {
  return doc.getMap('books').get(bookId)?.get('year') ?? null;
}

function bookYear(doc: TypedDoc, bookId: string): number | null {
  return doc.getMap('books').get(bookId)?.get('year') ?? null;
}

function favorites(doc: TypedDoc): FavoriteBookLink[] {
  return Array.from(doc.getMap('books').values())
    .filter((book) => book.get('favorite') === true)
    .map((book) => ({ id: book.get('id')!, year: book.get('year')! }))
    .sort((a, b) => b.year - a.year);
}

function statsBooks(doc: TypedDoc): StatsBookProjection[] {
  return Array.from(doc.getMap('books').values()).map((book) => ({
    year: book.get('year')!,
    entries: (book.get('entries')?.toArray() ?? []).map((entry) =>
      entry.toJSON(),
    ),
  }));
}

export const bookSelectors = {
  routeState: (bookId: string) => (doc: TypedDoc) => routeState(doc, bookId),
  libraryRows: () => (doc: TypedDoc) => libraryRows(doc),
  occupiedYears: () => (doc: TypedDoc) => occupiedYears(doc),
  duplicateYearSummary: () => (doc: TypedDoc) => duplicateYearSummary(doc),
  breadcrumb: (bookId: string) => (doc: TypedDoc) => breadcrumb(doc, bookId),
  year: (bookId: string) => (doc: TypedDoc) => bookYear(doc, bookId),
  favorites: () => (doc: TypedDoc) => favorites(doc),
  statsBooks: () => (doc: TypedDoc) => statsBooks(doc),
};

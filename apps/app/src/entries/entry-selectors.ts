import type { TypedDoc } from '../crdt/typed-doc';

import type { KpoEntry } from './entries-schema';

interface DescriptionSuggestionGroup {
  count: number;
  latestDate: string;
  value: string;
}

function all(doc: TypedDoc, bookId: string): KpoEntry[] {
  const yBook = doc.getMap('books').get(bookId);
  if (!yBook?.has('entries')) return [];
  const yEntries = yBook.get('entries')!;
  return yEntries.toArray().map((e) => e.toJSON());
}

function descriptionSuggestions(doc: TypedDoc): string[] {
  const suggestions = new Map<string, DescriptionSuggestionGroup>();

  for (const yBook of doc.getMap('books').values()) {
    for (const yEntry of yBook.get('entries')?.toArray() ?? []) {
      const entry = yEntry.toJSON();
      const key = entry.opisPrometa.trim().toLocaleLowerCase();
      if (!key) continue;

      const existing = suggestions.get(key);
      if (!existing) {
        suggestions.set(key, {
          count: 1,
          latestDate: entry.datumPrometa,
          value: entry.opisPrometa,
        });
        continue;
      }

      existing.count += 1;
      if (entry.datumPrometa >= existing.latestDate) {
        existing.latestDate = entry.datumPrometa;
        existing.value = entry.opisPrometa;
      }
    }
  }

  return Array.from(suggestions.values())
    .sort(
      (a, b) => b.count - a.count || b.latestDate.localeCompare(a.latestDate),
    )
    .map((suggestion) => suggestion.value);
}

export const entrySelectors = {
  all: (bookId: string) => (doc: TypedDoc) => all(doc, bookId),
  descriptionSuggestions: () => (doc: TypedDoc) => descriptionSuggestions(doc),
};

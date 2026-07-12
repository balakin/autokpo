import { describe, expect, it } from 'vitest';

import { filterSuggestions } from '../entry-suggestions';

const CORPUS = [
  'Konsultacije',
  'Izrada sajta',
  'Odrzavanje sajta',
  'Konsultantske usluge',
  'Prevod dokumentacije',
  'Konsultacije po satu',
  'Dizajn logotipa',
];

describe('filterSuggestions', () => {
  it('returns an empty array for an empty query', () => {
    expect(filterSuggestions(CORPUS, '')).toEqual([]);
  });

  it('returns an empty array for a whitespace-only query', () => {
    expect(filterSuggestions(CORPUS, '   ')).toEqual([]);
  });

  it('matches at the start of a suggestion', () => {
    expect(filterSuggestions(CORPUS, 'Izrada')).toEqual(['Izrada sajta']);
  });

  it('matches in the middle of a suggestion', () => {
    expect(filterSuggestions(CORPUS, 'dokument')).toEqual([
      'Prevod dokumentacije',
    ]);
  });

  it('matches case-insensitively', () => {
    expect(filterSuggestions(CORPUS, 'kOnSuLtAcIjE')).toEqual([
      'Konsultacije',
      'Konsultacije po satu',
    ]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterSuggestions(CORPUS, 'racunovodstvo')).toEqual([]);
  });

  it('caps the result at five suggestions by default', () => {
    const corpus = Array.from({ length: 12 }, (_, i) => `Usluga ${i + 1}`);
    expect(filterSuggestions(corpus, 'usluga')).toEqual([
      'Usluga 1',
      'Usluga 2',
      'Usluga 3',
      'Usluga 4',
      'Usluga 5',
    ]);
  });

  it('honors an explicit limit', () => {
    expect(filterSuggestions(CORPUS, 'sajta', 1)).toEqual(['Izrada sajta']);
  });

  it('preserves the corpus ranking order', () => {
    expect(filterSuggestions(CORPUS, 'a')).toEqual([
      'Konsultacije',
      'Izrada sajta',
      'Odrzavanje sajta',
      'Konsultantske usluge',
      'Prevod dokumentacije',
    ]);
  });

  it('returns only genuine matches', () => {
    const query = 'sajt';
    const results = filterSuggestions(CORPUS, query);

    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.toLocaleLowerCase()).toContain(query);
    }
  });
});

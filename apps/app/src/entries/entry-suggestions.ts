export const SUGGESTION_LIMIT = 5;

export function filterSuggestions(
  corpus: string[],
  query: string,
  limit: number = SUGGESTION_LIMIT,
): string[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];

  const matches: string[] = [];
  for (const suggestion of corpus) {
    if (matches.length >= limit) break;
    if (suggestion.toLocaleLowerCase().includes(needle)) {
      matches.push(suggestion);
    }
  }

  return matches;
}

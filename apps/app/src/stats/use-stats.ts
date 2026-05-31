import { useState } from 'react';

import { bookSelectors } from '../books/book-selectors';
import { useYDoc } from '../crdt';
import { belgradeToday } from '../utils/belgrade-date';

import { computeStats } from './compute';
import type { Stats } from './compute';

export type { Stats };

export function useStats(): Stats {
  const books = useYDoc(bookSelectors.statsBooks());
  const [today] = useState(() => belgradeToday().toDate('UTC'));
  return computeStats(books, today);
}

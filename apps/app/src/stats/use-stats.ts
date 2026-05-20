import { useState } from 'react';

import { belgradeToday } from '../belgrade-date';
import { bookSelectors } from '../books/book-selectors';
import { useYDoc } from '../crdt';

import { computeStats } from './compute';
import type { Stats } from './compute';

export type { Stats };

export function useStats(): Stats {
  const books = useYDoc(bookSelectors.statsBooks());
  const [today] = useState(() => belgradeToday().toDate('UTC'));
  return computeStats(books, today);
}

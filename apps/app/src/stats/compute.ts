import {
  type CalendarDate,
  fromDate,
  parseDate,
  toCalendarDate,
} from '@internationalized/date';

interface StatsEntry {
  datumPrometa: string;
  odProdajeProizvoda: number;
  odIzvrsenihUsluga: number;
}

interface StatsBook {
  year: number;
  entries: StatsEntry[];
}

export interface Stats {
  currentYearIncome: number;
  last12MonthsIncome: number;
  last12MonthsWindow: { start: Date; end: Date };
  historicalPeakYear: { year: number; income: number } | null;
  historicalPeak12M: {
    income: number;
    window: { start: Date; end: Date };
  } | null;
  allTimeTotal: number;
}

function entryIncome(e: {
  odProdajeProizvoda: number;
  odIzvrsenihUsluga: number;
}): number {
  return e.odProdajeProizvoda + e.odIzvrsenihUsluga;
}

export function computeStats(books: StatsBook[], today: Date): Stats {
  const todayDate = toCalendarDate(fromDate(today, 'UTC'));
  const currentYear = todayDate.year;
  const windowStartDate = todayDate.subtract({ months: 12 });
  const windowStart = windowStartDate.toDate('UTC');
  const windowStartStr = windowStartDate.toString();
  const todayStr = todayDate.toString();

  // Current year income — uses the book whose year matches today's year
  const currentYearBook = books.find((b) => b.year === currentYear);
  const currentYearIncome = currentYearBook
    ? currentYearBook.entries.reduce((sum, e) => sum + entryIncome(e), 0)
    : 0;

  // Rolling last-12-months income
  let last12MonthsIncome = 0;
  for (const book of books) {
    for (const entry of book.entries) {
      if (
        entry.datumPrometa >= windowStartStr &&
        entry.datumPrometa <= todayStr
      ) {
        last12MonthsIncome += entryIncome(entry);
      }
    }
  }

  // Historical peak year — most income; most recent year wins on tie
  let historicalPeakYear: { year: number; income: number } | null = null;
  for (const book of books) {
    const income = book.entries.reduce((sum, e) => sum + entryIncome(e), 0);
    if (
      historicalPeakYear === null ||
      income > historicalPeakYear.income ||
      (income === historicalPeakYear.income &&
        book.year > historicalPeakYear.year)
    ) {
      historicalPeakYear = { year: book.year, income };
    }
  }

  // All-time total
  let allTimeTotal = 0;
  for (const book of books) {
    for (const entry of book.entries) {
      allTimeTotal += entryIncome(entry);
    }
  }

  // Historical peak 12M — two-pointer sliding window over all entries sorted by date
  let historicalPeak12M: {
    income: number;
    window: { start: Date; end: Date };
  } | null = null;

  const allEntries: { datumPrometa: string; income: number }[] = [];
  for (const book of books) {
    for (const entry of book.entries) {
      allEntries.push({
        datumPrometa: entry.datumPrometa,
        income: entryIncome(entry),
      });
    }
  }
  allEntries.sort((a, b) => a.datumPrometa.localeCompare(b.datumPrometa));

  if (allEntries.length > 0) {
    let left = 0;
    let runningSum = 0;
    let peakSum = -1;
    let peakEndDate: CalendarDate | null = null;

    for (let right = 0; right < allEntries.length; right++) {
      runningSum += allEntries[right].income;
      const rightDate = parseDate(allEntries[right].datumPrometa);
      const leftBoundStr = rightDate.subtract({ months: 12 }).toString();

      while (left <= right && allEntries[left].datumPrometa < leftBoundStr) {
        runningSum -= allEntries[left].income;
        left++;
      }

      if (runningSum > peakSum) {
        peakSum = runningSum;
        peakEndDate = rightDate;
      }
    }

    if (peakEndDate !== null) {
      historicalPeak12M = {
        income: peakSum,
        window: {
          start: peakEndDate.subtract({ months: 12 }).toDate('UTC'),
          end: peakEndDate.toDate('UTC'),
        },
      };
    }
  }

  return {
    currentYearIncome,
    last12MonthsIncome,
    last12MonthsWindow: { start: windowStart, end: today },
    historicalPeakYear,
    historicalPeak12M,
    allTimeTotal,
  };
}

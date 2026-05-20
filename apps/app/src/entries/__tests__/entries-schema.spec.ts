import { CalendarDate } from '@internationalized/date';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import 'src/i18n/i18n';
import { belgradeToday } from '../../belgrade-date';
import { createKpoEntrySchema, createEntryFormSchema } from '../entries-schema';

vi.mock('../../belgrade-date');

const TODAY = '2025-04-25';
const YEAR = 2025;

beforeEach(() => {
  vi.mocked(belgradeToday).mockReturnValue(new CalendarDate(2025, 4, 25));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createKpoEntrySchema', () => {
  const validBase = {
    id: '00000000-0000-4000-8000-000000000001',
    datumPrometa: '2025-03-15',
    opisPrometa: 'Prihod od prodaje',
    odProdajeProizvoda: 50000,
    odIzvrsenihUsluga: 0,
  };

  it('accepts a valid entry', () => {
    expect(createKpoEntrySchema(YEAR).safeParse(validBase).success).toBe(true);
  });

  it('accepts Jan 1 of the book year as datumPrometa', () => {
    const result = createKpoEntrySchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2025-01-01',
    });
    expect(result.success).toBe(true);
  });

  it('accepts today as datumPrometa', () => {
    const result = createKpoEntrySchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: TODAY,
    });
    expect(result.success).toBe(true);
  });

  it('accepts Dec 31 of the book year as datumPrometa', () => {
    vi.mocked(belgradeToday).mockReturnValue(new CalendarDate(2025, 12, 31));
    const result = createKpoEntrySchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2025-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty date', () => {
    const result = createKpoEntrySchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Polje je obavezno');
  });

  it('rejects malformed date format', () => {
    const result = createKpoEntrySchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2025/04/20',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Neispravan format datuma');
  });

  it.each(['2025-02-30', '2025-04-31', '2025-13-01'])(
    'rejects impossible calendar date %s',
    (datumPrometa) => {
      const result = createKpoEntrySchema(YEAR).safeParse({
        ...validBase,
        datumPrometa,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Neispravan format datuma');
    },
  );

  it('rejects a future date', () => {
    const result = createKpoEntrySchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2025-05-01',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Datum ne može biti u budućnosti',
    );
  });

  it('rejects a date before the book year', () => {
    const result = createKpoEntrySchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2024-12-31',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Datum mora biti u godini knjige',
    );
  });

  it('rejects a date after the book year', () => {
    vi.mocked(belgradeToday).mockReturnValue(new CalendarDate(2026, 1, 15));
    const result = createKpoEntrySchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2026-01-01',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Datum mora biti u godini knjige',
    );
  });

  it('reports year-boundary error before future-date error', () => {
    // today is within the book year; the date is both after year-end and in the future
    const result = createKpoEntrySchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2026-01-01',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Datum mora biti u godini knjige',
    );
  });

  it('rejects negative odProdajeProizvoda', () => {
    const result = createKpoEntrySchema(YEAR).safeParse({
      ...validBase,
      odProdajeProizvoda: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('createEntryFormSchema', () => {
  const validBase = {
    datumPrometa: '2025-03-15',
    opisPrometa: 'Prihod od prodaje',
    odProdajeProizvoda: '50000',
    odIzvrsenihUsluga: '0',
  };

  it('accepts valid form data', () => {
    expect(createEntryFormSchema(YEAR).safeParse(validBase).success).toBe(true);
  });

  it('accepts comma as decimal separator in amount fields', () => {
    const result = createEntryFormSchema(YEAR).safeParse({
      ...validBase,
      odProdajeProizvoda: '50,50',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative amount', () => {
    const result = createEntryFormSchema(YEAR).safeParse({
      ...validBase,
      odProdajeProizvoda: '-100',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Vrednost ne može biti negativna',
    );
  });

  it('rejects non-numeric amount', () => {
    const result = createEntryFormSchema(YEAR).safeParse({
      ...validBase,
      odIzvrsenihUsluga: 'abc',
    });
    expect(result.success).toBe(false);
  });

  it('rejects future date', () => {
    const result = createEntryFormSchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2025-05-01',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Datum ne može biti u budućnosti',
    );
  });

  it('rejects date before book year', () => {
    const result = createEntryFormSchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2024-12-31',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Datum mora biti u godini knjige',
    );
  });

  it('rejects date after book year', () => {
    vi.mocked(belgradeToday).mockReturnValue(new CalendarDate(2026, 1, 15));
    const result = createEntryFormSchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2026-01-01',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Datum mora biti u godini knjige',
    );
  });

  it('accepts Jan 1 boundary date', () => {
    const result = createEntryFormSchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2025-01-01',
    });
    expect(result.success).toBe(true);
  });

  it('accepts Dec 31 boundary date', () => {
    vi.mocked(belgradeToday).mockReturnValue(new CalendarDate(2025, 12, 31));
    const result = createEntryFormSchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2025-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty date', () => {
    const result = createEntryFormSchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Polje je obavezno');
  });

  it('rejects malformed date format', () => {
    const result = createEntryFormSchema(YEAR).safeParse({
      ...validBase,
      datumPrometa: '2025/04/20',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Neispravan format datuma');
  });
});

import { CalendarDate, parseDate } from '@internationalized/date';
import { t } from '@lingui/core/macro';
import { z } from 'zod';

import { belgradeToday } from '../utils/belgrade-date';

export type KpoEntry = z.infer<ReturnType<typeof createKpoEntrySchema>>;

export function createKpoEntrySchema(year: number) {
  return z.object({
    id: z.uuid(),
    datumPrometa: datumPrometaSchema(year),
    opisPrometa: z.string().min(1, t`Polje je obavezno`),
    odProdajeProizvoda: z.number().min(0, t`Vrednost ne može biti negativna`),
    odIzvrsenihUsluga: z.number().min(0, t`Vrednost ne može biti negativna`),
  });
}

export type EntryFormData = z.infer<ReturnType<typeof createEntryFormSchema>>;
export type EntryModelData = Omit<KpoEntry, 'id'>;

export function createEntryFormSchema(year: number) {
  const currencyField = z
    .string()
    .min(1, t`Polje je obavezno`)
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v.replace(',', '.')) >= 0,
      {
        message: t`Vrednost ne može biti negativna`,
      },
    );

  return z.object({
    datumPrometa: datumPrometaSchema(year),
    opisPrometa: z.string().min(1, t`Polje je obavezno`),
    odProdajeProizvoda: currencyField,
    odIzvrsenihUsluga: currencyField,
  });
}

function datumPrometaSchema(year: number) {
  return z
    .string()
    .min(1, t`Polje je obavezno`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, t`Neispravan format datuma`)
    .refine((d) => parseIsoCalendarDateSafe(d) !== null, {
      message: t`Neispravan format datuma`,
    })
    .refine((d) => !isBeforeBookYear(d, year), {
      message: t`Datum mora biti u godini knjige`,
    })
    .refine((d) => !isAfterBookYear(d, year), {
      message: t`Datum mora biti u godini knjige`,
    })
    .refine((d) => !isFutureDate(d), {
      message: t`Datum ne može biti u budućnosti`,
    });
}

function isFutureDate(d: string): boolean {
  return withParsedDate(d, (value) => value.compare(belgradeToday()) > 0);
}

function isBeforeBookYear(d: string, year: number): boolean {
  return withParsedDate(d, (value) => value.compare(startOfBookYear(year)) < 0);
}

function isAfterBookYear(d: string, year: number): boolean {
  return withParsedDate(d, (value) => value.compare(endOfBookYear(year)) > 0);
}

function startOfBookYear(year: number): CalendarDate {
  return new CalendarDate(year, 1, 1);
}

function endOfBookYear(year: number): CalendarDate {
  return new CalendarDate(year, 12, 31);
}

function withParsedDate(
  value: string,
  check: (date: CalendarDate) => boolean,
): boolean {
  const parsed = parseIsoCalendarDateSafe(value);
  return parsed === null ? false : check(parsed);
}

function parseIsoCalendarDateSafe(value: string): CalendarDate | null {
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

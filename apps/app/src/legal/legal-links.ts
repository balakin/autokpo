import { DEFAULT_LOCALE, LOCALES } from '../i18n/i18n';
import type { Locale } from '../i18n/i18n';

const LEGAL_ORIGIN = 'https://autokpo.com';

export type LegalDocument = 'terms' | 'privacy';

export type LegalLinks = Record<LegalDocument, string>;

function normalizeLocale(locale: string): Locale {
  return (LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE;
}

function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

export function getLegalLinks(locale: string): LegalLinks {
  const prefix = localePrefix(normalizeLocale(locale));

  return {
    terms: `${LEGAL_ORIGIN}${prefix}/terms/`,
    privacy: `${LEGAL_ORIGIN}${prefix}/privacy/`,
  };
}

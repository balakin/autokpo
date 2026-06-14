import { DEFAULT_LOCALE, LOCALES } from './i18n';
import type { Locale } from './i18n';

export const STORAGE_KEY = 'autokpo:locale';

function bestMatch(lang: string): Locale | undefined {
  if (!lang) return undefined;
  if ((LOCALES as readonly string[]).includes(lang)) return lang as Locale;
  const prefix = lang.split('-')[0];
  return LOCALES.find((l) => l.split('-')[0] === prefix);
}

export function getStoredLocale(): string {
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LOCALE;
}

export function readLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (LOCALES as readonly string[]).includes(stored)) {
    return stored as Locale;
  }
  const queryLang = new URL(window.location.href).searchParams.get('lang');
  if (queryLang && (LOCALES as readonly string[]).includes(queryLang)) {
    // Persist so CrdtProvider can read it before the doc is ready
    localStorage.setItem(STORAGE_KEY, queryLang);
    return queryLang as Locale;
  }
  const matched = bestMatch(navigator.language) ?? DEFAULT_LOCALE;
  // Persist so CrdtProvider can read it before the doc is ready
  localStorage.setItem(STORAGE_KEY, matched);
  return matched;
}

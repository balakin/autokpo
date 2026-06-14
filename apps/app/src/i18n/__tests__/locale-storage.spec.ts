import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_LOCALE } from '../i18n';
import { STORAGE_KEY, getStoredLocale, readLocale } from '../locale-storage';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('getStoredLocale', () => {
  it('returns the stored locale', () => {
    localStorage.setItem(STORAGE_KEY, 'en');
    expect(getStoredLocale()).toBe('en');
  });

  it('returns DEFAULT_LOCALE when nothing is stored', () => {
    expect(getStoredLocale()).toBe(DEFAULT_LOCALE);
  });
});

describe('readLocale — stored value', () => {
  it('returns sr-Latn when stored', () => {
    localStorage.setItem(STORAGE_KEY, 'sr-Latn');
    expect(readLocale()).toBe('sr-Latn');
  });

  it('returns en when stored', () => {
    localStorage.setItem(STORAGE_KEY, 'en');
    expect(readLocale()).toBe('en');
  });

  it('returns ru when stored', () => {
    localStorage.setItem(STORAGE_KEY, 'ru');
    expect(readLocale()).toBe('ru');
  });
});

describe('readLocale — navigator.language fallback', () => {
  it('matches en from exact navigator.language', () => {
    vi.stubGlobal('navigator', { ...navigator, language: 'en' });
    expect(readLocale()).toBe('en');
  });

  it('matches en from en-US prefix', () => {
    vi.stubGlobal('navigator', { ...navigator, language: 'en-US' });
    expect(readLocale()).toBe('en');
  });

  it('matches ru from ru-RU prefix', () => {
    vi.stubGlobal('navigator', { ...navigator, language: 'ru-RU' });
    expect(readLocale()).toBe('ru');
  });

  it('falls back to en when navigator.language has no supported match', () => {
    vi.stubGlobal('navigator', { ...navigator, language: 'fr-FR' });
    expect(readLocale()).toBe('en');
  });

  it('falls back to en when navigator.language is empty', () => {
    vi.stubGlobal('navigator', { ...navigator, language: '' });
    expect(readLocale()).toBe('en');
  });

  it('falls back via navigator.language when stored value is invalid', () => {
    vi.stubGlobal('navigator', { ...navigator, language: 'ru' });
    localStorage.setItem(STORAGE_KEY, 'fr');
    expect(readLocale()).toBe('ru');
  });

  it('persists the resolved locale to localStorage', () => {
    vi.stubGlobal('navigator', { ...navigator, language: 'en-GB' });
    readLocale();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });
});

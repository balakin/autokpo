import { i18n as lingui } from '@lingui/core';

import { messages as en } from '../locales/en.po';
import { messages as ru } from '../locales/ru.po';
import { messages as srLatn } from '../locales/sr-Latn.po';

export const LOCALES = ['sr-Latn', 'en', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_NAMES: Record<Locale, string> = {
  'sr-Latn': 'Srpski',
  en: 'English',
  ru: 'Русский',
};

export const INTL_LOCALES: Record<Locale, string> = {
  'sr-Latn': 'sr-Latn',
  en: 'en',
  ru: 'ru',
};

lingui.load('sr-Latn', srLatn);
lingui.load('en', en);
lingui.load('ru', ru);
lingui.activate(DEFAULT_LOCALE);

export { lingui as i18n };

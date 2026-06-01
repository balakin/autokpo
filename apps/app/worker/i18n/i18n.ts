import { setupI18n } from '@lingui/core';

import { messages as en } from '../locales/en.po';
import { messages as ru } from '../locales/ru.po';
import { messages as srLatn } from '../locales/sr-Latn.po';

export const WORKER_LOCALES = ['sr-Latn', 'en', 'ru'] as const;
export type WorkerLocale = (typeof WORKER_LOCALES)[number];

const allMessages = { 'sr-Latn': srLatn, en, ru };

export function isWorkerLocale(value: unknown): value is WorkerLocale {
  return (WORKER_LOCALES as readonly unknown[]).includes(value);
}

export function createI18n(locale: WorkerLocale) {
  return setupI18n({ locale, messages: allMessages });
}

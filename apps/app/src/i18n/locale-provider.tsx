import { I18nProvider } from '@heroui/react';
import { useEffect, useState, type ReactNode } from 'react';

import { i18n, INTL_LOCALES, LOCALES } from './i18n';
import type { Locale } from './i18n';
import { LocaleContext } from './locale-context';
import { STORAGE_KEY, readLocale } from './locale-storage';

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(readLocale);

  function handleLocaleChange(newLocale: Locale) {
    localStorage.setItem(STORAGE_KEY, newLocale);
    setLocale(newLocale);
    i18n.activate(newLocale);
  }

  useEffect(() => {
    i18n.activate(locale);
  }, [locale]);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      if ((LOCALES as readonly string[]).includes(e.newValue)) {
        const newLocale = e.newValue as Locale;
        setLocale(newLocale);
        i18n.activate(newLocale);
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <LocaleContext value={{ locale, setLocale: handleLocaleChange }}>
      <I18nProvider locale={INTL_LOCALES[locale]}>{children}</I18nProvider>
    </LocaleContext>
  );
}

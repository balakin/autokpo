import type { ReactNode } from 'react';

import type { Locale } from '../i18n/i18n';
import { LocaleContext } from '../i18n/locale-context';
import { useLocale } from '../i18n/use-locale';

import { LocaleSynchronizer } from './locale-synchronizer';
import { useDoc } from './use-doc';

export function CrdtLocaleProvider({ children }: { children: ReactNode }) {
  const ydoc = useDoc();
  const { locale } = useLocale();

  function setCrdtLocale(newLocale: Locale) {
    ydoc.transact(() => {
      ydoc.getMap('user').set('locale', newLocale);
    });
  }

  return (
    <>
      <LocaleSynchronizer />
      <LocaleContext value={{ locale, setLocale: setCrdtLocale }}>
        {children}
      </LocaleContext>
    </>
  );
}

import { useEffect } from 'react';

import type { Locale } from '../i18n/i18n';
import { useLocale } from '../i18n/use-locale';

import type { TypedDoc } from './typed-doc';
import { useYDoc } from './use-y-doc';

function localeSelector(doc: TypedDoc): string | undefined {
  return doc.getMap('user').get('locale');
}

export function LocaleSynchronizer() {
  const { setLocale } = useLocale();
  const crdtLocale = useYDoc(localeSelector);

  useEffect(() => {
    if (!crdtLocale) return;
    setLocale(crdtLocale as Locale);
  }, [crdtLocale, setLocale]);

  return null;
}

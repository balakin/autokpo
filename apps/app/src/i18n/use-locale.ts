import { use } from 'react';

import { LocaleContext } from './locale-context';

export function useLocale() {
  return use(LocaleContext);
}

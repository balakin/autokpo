import { use } from 'react';

import { DocContext } from './doc-context';
import type { TypedDoc } from './typed-doc';

export function useDoc(): TypedDoc {
  const ydoc = use(DocContext);
  if (!ydoc) {
    throw new Error('useDoc must be used within DocContext.');
  }
  return ydoc;
}

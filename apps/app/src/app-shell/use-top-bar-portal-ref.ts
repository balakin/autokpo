import { use } from 'react';

import { TopBarPortalContext } from './top-bar-actions-context';

/** Returns a stable callback ref to register the top bar's portal container. */
export function useTopBarPortalRef() {
  const { setPortalTarget } = use(TopBarPortalContext);
  return setPortalTarget;
}

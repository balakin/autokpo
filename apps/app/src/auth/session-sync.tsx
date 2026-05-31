import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { subscribeToSessionChanges } from './session-broadcast';
import {
  clearQueryCacheOnSignOut,
  SESSION_QUERY_KEY,
} from './use-session-query';

export function SessionSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return subscribeToSessionChanges((session) => {
      if (session === null) {
        clearQueryCacheOnSignOut(queryClient);
      } else {
        queryClient.setQueryData(SESSION_QUERY_KEY, session);
      }
    });
  }, [queryClient]);

  return null;
}

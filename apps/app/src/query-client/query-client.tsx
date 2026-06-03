import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { ReactElement, ReactNode } from 'react';

import { SESSION_QUERY_KEY } from '../auth/use-session-query';
import { SESSION_LIFETIME_MS } from '../constants';
import { KEY_RING_PROFILE_QUERY_KEY } from '../e2ee/key-ring-query';

import { queryPersister } from './query-persister';

const queryClient = new QueryClient();

export function QueryClientProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: SESSION_LIFETIME_MS,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const key = query.queryKey[0];
            return (
              key === SESSION_QUERY_KEY[0] || key === KEY_RING_PROFILE_QUERY_KEY
            );
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

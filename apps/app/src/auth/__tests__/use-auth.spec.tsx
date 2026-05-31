import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAuth } from '../use-auth';
import { SESSION_QUERY_KEY } from '../use-session-query';

function makeQueryClient(userId: string | null) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  qc.setQueryData(
    SESSION_QUERY_KEY,
    userId ? { id: userId, email: 'u1@example.com', sessionId: null } : null,
  );
  return qc;
}

function UseAuthHarness() {
  const auth = useAuth();
  return <span>{auth.user?.id ?? 'null'}</span>;
}

describe('useAuth', () => {
  it('reads session from React Query cache', () => {
    render(
      <QueryClientProvider client={makeQueryClient('u1')}>
        <UseAuthHarness />
      </QueryClientProvider>,
    );

    expect(screen.getByText('u1')).toBeInTheDocument();
  });

  it('returns null user when no session', () => {
    render(
      <QueryClientProvider client={makeQueryClient(null)}>
        <UseAuthHarness />
      </QueryClientProvider>,
    );

    expect(screen.getByText('null')).toBeInTheDocument();
  });
});

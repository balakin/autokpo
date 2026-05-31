import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAuth } from '../use-auth';
import { SESSION_QUERY_KEY } from '../use-session-query';

function makeQueryClient(userId: string | null | undefined) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  if (userId !== undefined) {
    qc.setQueryData(
      SESSION_QUERY_KEY,
      userId ? { id: userId, email: 'u1@example.com', sessionId: null } : null,
    );
  }
  return qc;
}

function UseAuthHarness() {
  const auth = useAuth();
  return (
    <>
      <span data-testid="userId">{auth.user?.id ?? 'null'}</span>
      <span data-testid="pending">{String(auth.isPending)}</span>
    </>
  );
}

describe('useAuth', () => {
  it('reads session from React Query cache', () => {
    render(
      <QueryClientProvider client={makeQueryClient('u1')}>
        <UseAuthHarness />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('userId')).toHaveTextContent('u1');
    expect(screen.getByTestId('pending')).toHaveTextContent('false');
  });

  it('returns null user when no session', () => {
    render(
      <QueryClientProvider client={makeQueryClient(null)}>
        <UseAuthHarness />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('userId')).toHaveTextContent('null');
    expect(screen.getByTestId('pending')).toHaveTextContent('false');
  });

  it('returns isPending when query has not resolved', () => {
    render(
      <QueryClientProvider client={makeQueryClient(undefined)}>
        <UseAuthHarness />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('pending')).toHaveTextContent('true');
    expect(screen.getByTestId('userId')).toHaveTextContent('null');
  });
});

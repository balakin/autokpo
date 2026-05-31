import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useRequiredUserId } from '../use-required-user-id';
import { SESSION_QUERY_KEY } from '../use-session-query';

function makeQueryClient(userId: string | null) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  qc.setQueryData(
    SESSION_QUERY_KEY,
    userId ? { id: userId, email: null, sessionId: null } : null,
  );
  return qc;
}

function RequiredUserHarness() {
  const userId = useRequiredUserId();
  return <span>{userId}</span>;
}

describe('useRequiredUserId', () => {
  it('returns user id when signed in', () => {
    render(
      <QueryClientProvider client={makeQueryClient('required-user')}>
        <RequiredUserHarness />
      </QueryClientProvider>,
    );

    expect(screen.getByText('required-user')).toBeInTheDocument();
  });

  it('throws when user is missing', () => {
    expect(() =>
      render(
        <QueryClientProvider client={makeQueryClient(null)}>
          <RequiredUserHarness />
        </QueryClientProvider>,
      ),
    ).toThrow('useRequiredUserId must be used when user is signed in.');
  });
});

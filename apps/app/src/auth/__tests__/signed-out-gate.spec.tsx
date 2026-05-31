import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { LocationDisplay } from 'tests/render-helpers';
import { describe, expect, it } from 'vitest';

import { SignedOutGate } from '../signed-out-gate';
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

function setup(userId: string | null) {
  const router = createMemoryRouter(
    [
      {
        path: '/entry',
        element: (
          <SignedOutGate>
            <span>public content</span>
          </SignedOutGate>
        ),
      },
      { path: '/dashboard', element: <LocationDisplay /> },
    ],
    { initialEntries: ['/entry'] },
  );
  render(
    <QueryClientProvider client={makeQueryClient(userId)}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('SignedOutGate', () => {
  it('renders children when not signed in', () => {
    setup(null);
    expect(screen.getByText('public content')).toBeInTheDocument();
  });

  it('redirects to /dashboard when signed in', () => {
    setup('user-1');
    expect(screen.getByLabelText('current-location')).toHaveTextContent(
      '/dashboard',
    );
    expect(screen.queryByText('public content')).not.toBeInTheDocument();
  });
});

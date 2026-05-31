import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { LocationDisplay } from 'tests/render-helpers';
import { describe, expect, it } from 'vitest';

import { SignedInGate } from '../signed-in-gate';
import { SESSION_QUERY_KEY } from '../use-session-query';

function makeQueryClient(userId: string | null | undefined) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  if (userId !== undefined) {
    qc.setQueryData(
      SESSION_QUERY_KEY,
      userId ? { id: userId, email: null, sessionId: null } : null,
    );
  }
  return qc;
}

function setup(userId: string | null | undefined) {
  const router = createMemoryRouter(
    [
      {
        path: '/protected',
        element: (
          <SignedInGate>
            <span>protected content</span>
          </SignedInGate>
        ),
      },
      { path: '/sign-in', element: <LocationDisplay /> },
    ],
    { initialEntries: ['/protected'] },
  );
  render(
    <QueryClientProvider client={makeQueryClient(userId)}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('SignedInGate', () => {
  it('renders children when signed in', () => {
    setup('user-1');
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('redirects to /sign-in when not signed in', () => {
    setup(null);
    expect(screen.getByLabelText('current-location')).toHaveTextContent(
      '/sign-in',
    );
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders nothing while session is pending', () => {
    setup(undefined);
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('current-location')).not.toBeInTheDocument();
  });
});

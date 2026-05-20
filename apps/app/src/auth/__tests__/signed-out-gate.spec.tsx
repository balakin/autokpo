import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { LocationDisplay } from 'tests/render-helpers';
import { describe, expect, it } from 'vitest';

import { AuthContext } from '../auth-context';
import { SignedOutGate } from '../signed-out-gate';

function makeAuth(userId: string | null) {
  return {
    user: userId === null ? null : { id: userId, email: null, image: null },
    refresh: () => Promise.resolve(userId),
    logout: () => Promise.resolve(),
  };
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
    <AuthContext value={makeAuth(userId)}>
      <RouterProvider router={router} />
    </AuthContext>,
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

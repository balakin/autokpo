import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { LocationDisplay } from 'tests/render-helpers';
import { describe, expect, it } from 'vitest';

import { AuthContext } from '../auth-context';
import { SignedInGate } from '../signed-in-gate';

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
    <AuthContext value={makeAuth(userId)}>
      <RouterProvider router={router} />
    </AuthContext>,
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
});

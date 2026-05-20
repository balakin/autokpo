import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '../../i18n/i18n';
import { AuthContext } from '../auth-context';
import { GoodbyePage } from '../goodbye-page';
import { SignedOutGate } from '../signed-out-gate';

vi.mock('../../i18n/use-locale', () => ({
  useLocale: () => ({ locale: 'sr-Latn', setLocale: vi.fn() }),
}));

vi.mock('../../settings/use-theme', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn() }),
}));

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
        path: '/dashboard',
        element: <span aria-label="current-location">/dashboard</span>,
      },
      {
        path: '/goodbye',
        element: (
          <AuthContext value={makeAuth(userId)}>
            <SignedOutGate>
              <GoodbyePage />
            </SignedOutGate>
          </AuthContext>
        ),
      },
    ],
    { initialEntries: ['/goodbye'] },
  );

  return render(
    <I18nProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nProvider>,
  );
}

describe('GoodbyePage', () => {
  it('shows the deleted-account page while signed out', async () => {
    setup(null);

    expect(await screen.findByText('Nalog je obrisan')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Nazad na prijavu' }),
    ).toBeInTheDocument();
  });

  it('redirects signed-in users away from /goodbye', async () => {
    setup('user-1');

    expect(await screen.findByLabelText('current-location')).toHaveTextContent(
      '/dashboard',
    );
  });
});

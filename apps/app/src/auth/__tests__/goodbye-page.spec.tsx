import { I18nProvider } from '@lingui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '../../i18n/i18n';
import { GoodbyePage } from '../goodbye-page';
import { SignedOutGate } from '../signed-out-gate';
import { SESSION_QUERY_KEY } from '../use-session-query';

vi.mock('../../i18n/use-locale', () => ({
  useLocale: () => ({ locale: 'sr-Latn', setLocale: vi.fn() }),
}));

vi.mock('../../settings/use-theme', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn() }),
}));

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
  const queryClient = makeQueryClient(userId);
  const router = createMemoryRouter(
    [
      {
        path: '/dashboard',
        element: <span aria-label="current-location">/dashboard</span>,
      },
      {
        path: '/goodbye',
        element: (
          <SignedOutGate>
            <GoodbyePage />
          </SignedOutGate>
        ),
      },
    ],
    { initialEntries: ['/goodbye'] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nProvider>
    </QueryClientProvider>,
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

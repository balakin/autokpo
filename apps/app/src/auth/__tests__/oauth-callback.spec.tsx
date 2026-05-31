import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { I18nWrapper, LocationDisplay } from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OAuthCallback } from '../oauth-callback';

const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock('../auth-client', () => ({
  authClient: { getSession: getSessionMock },
}));

vi.mock('../../e2ee/cleanup', () => ({
  clearLocalEncryptionUnlockMaterial: vi.fn(),
}));

function setup(initialEntry = '/sign-in/oauth/google/callback') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const router = createMemoryRouter(
    [
      {
        path: '/sign-in/oauth/:provider/callback',
        element: <OAuthCallback />,
      },
      { path: '/dashboard', element: <LocationDisplay /> },
      { path: '/sign-in', element: <LocationDisplay /> },
    ],
    { initialEntries: [initialEntry] },
  );
  render(
    <QueryClientProvider client={queryClient}>
      <I18nWrapper>
        <RouterProvider router={router} />
      </I18nWrapper>
    </QueryClientProvider>,
  );
}

describe('OAuthCallback', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
  });

  it('shows loading state while session is being fetched', () => {
    getSessionMock.mockImplementation(() => new Promise(() => {}));
    setup();
    expect(
      screen.queryByText('Google prijava nije bila uspešna.'),
    ).not.toBeInTheDocument();
  });

  it('navigates to /dashboard when session is found', async () => {
    getSessionMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    setup();
    await waitFor(() =>
      expect(screen.getByLabelText('current-location')).toHaveTextContent(
        '/dashboard',
      ),
    );
  });

  it('shows provider-aware heading and retry message when session returns null', async () => {
    getSessionMock.mockResolvedValue({ data: null });
    setup();
    expect(
      await screen.findByText('Google prijava nije bila uspešna.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Prijava nije završena. Pokušajte ponovo.'),
    ).toBeInTheDocument();
  });

  it('shows provider-aware heading and small muted code for unrecognized error from query param without calling refresh', () => {
    setup('/sign-in/oauth/google/callback?error=invalid_code');
    expect(
      screen.getByText('Google prijava nije bila uspešna.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Došlo je do greške. Pokušajte ponovo.'),
    ).toBeInTheDocument();
    const codeEl = screen.getByText('invalid_code');
    expect(codeEl.tagName).toBe('P');
    expect(codeEl).toHaveClass('text-xs');
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('shows generic heading for unknown provider', () => {
    getSessionMock.mockImplementation(() => new Promise(() => {}));
    setup('/sign-in/oauth/unknown/callback?error=access_denied');
    expect(screen.getByText('Prijava nije uspela.')).toBeInTheDocument();
  });

  it('shows github provider name in heading for github provider', () => {
    getSessionMock.mockImplementation(() => new Promise(() => {}));
    setup('/sign-in/oauth/github/callback?error=access_denied');
    expect(
      screen.getByText('GitHub prijava nije bila uspešna.'),
    ).toBeInTheDocument();
  });

  it('shows cancel message for access_denied and no error code element', () => {
    setup('/sign-in/oauth/google/callback?error=access_denied');
    expect(
      screen.getByText('Otkazali ste prijavu. Pokušajte ponovo.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('access_denied')).not.toBeInTheDocument();
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('shows provider email guidance for email_not_found and no raw code', () => {
    setup('/sign-in/oauth/github/callback?error=email_not_found');
    expect(
      screen.getByText(
        'Vaš nalog nema javnu email adresu. Prijavite se putem jednokratnog koda na email.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('email_not_found')).not.toBeInTheDocument();
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('shows session-expired message for state_mismatch and no raw code', () => {
    setup('/sign-in/oauth/google/callback?error=state_mismatch');
    expect(
      screen.getByText('Sesija je istekla. Pokušajte ponovo.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('state_mismatch')).not.toBeInTheDocument();
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('shows session-expired message for please_restart_the_process and no raw code', () => {
    setup('/sign-in/oauth/google/callback?error=please_restart_the_process');
    expect(
      screen.getByText('Sesija je istekla. Pokušajte ponovo.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('please_restart_the_process'),
    ).not.toBeInTheDocument();
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('shows retry message for missing_session and no raw code', async () => {
    getSessionMock.mockResolvedValue({ data: null });
    setup();
    expect(
      await screen.findByText('Prijava nije završena. Pokušajte ponovo.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('missing_session')).not.toBeInTheDocument();
  });

  it('shows generic message and small muted code for unrecognized error', () => {
    setup('/sign-in/oauth/google/callback?error=unable_to_create_session');
    expect(
      screen.getByText('Došlo je do greške. Pokušajte ponovo.'),
    ).toBeInTheDocument();
    const codeEl = screen.getByText('unable_to_create_session');
    expect(codeEl.tagName).toBe('P');
    expect(codeEl).toHaveClass('text-xs');
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('shows collision message for account_not_linked without displaying raw code', () => {
    setup('/sign-in/oauth/google/callback?error=account_not_linked');
    expect(
      screen.getByText(
        'Nalog sa ovom email adresom već postoji. Prijavite se putem jednokratnog koda na email.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Kod: account_not_linked'),
    ).not.toBeInTheDocument();
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('navigates back to /sign-in when back button clicked', async () => {
    const user = userEvent.setup();
    setup('/sign-in/oauth/google/callback?error=access_denied');
    await user.click(screen.getByRole('button', { name: 'Nazad na prijavu' }));
    expect(screen.getByLabelText('current-location')).toHaveTextContent(
      '/sign-in',
    );
  });
});

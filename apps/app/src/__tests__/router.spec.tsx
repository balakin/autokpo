import { render, screen } from '@testing-library/react';
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router';
import { I18nWrapper } from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LOCAL_ENCRYPTION_UNLOCK_KEY } from '../e2ee/cleanup';
import { createAppRoutes } from '../router';

const getSessionMock = vi.hoisted(() => vi.fn());
const signedInAppRenderMock = vi.hoisted(() => vi.fn());
const dashboardRenderMock = vi.hoisted(() => vi.fn());

vi.mock('../auth/auth-client', () => ({
  authClient: {
    getSession: getSessionMock,
    signIn: {
      social: vi.fn(),
      emailOtp: vi.fn(),
    },
    emailOtp: {
      sendVerificationOtp: vi.fn(),
    },
    signOut: vi.fn(),
  },
}));

vi.mock('../signed-in-app', () => ({
  SignedInApp: () => {
    signedInAppRenderMock();
    return <Outlet />;
  },
}));

vi.mock('../dashboard/dashboard-page', () => ({
  DashboardPage: () => {
    dashboardRenderMock();
    return <div>Lazy dashboard</div>;
  },
}));

function renderRouter(initialEntry: string) {
  const router = createMemoryRouter(createAppRoutes(), {
    initialEntries: [initialEntry],
  });

  render(
    <I18nWrapper>
      <RouterProvider router={router} />
    </I18nWrapper>,
  );
}

describe('router bundle boundaries', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('autokpo:locale', 'sr-Latn');
    getSessionMock.mockReset();
    getSessionMock.mockImplementation(() => new Promise(() => {}));
    signedInAppRenderMock.mockClear();
    dashboardRenderMock.mockClear();
  });

  it('redirects a signed-out protected-route visit before loading signed-in app', async () => {
    renderRouter('/dashboard');

    expect(await screen.findByText('Dobrodošli')).toBeInTheDocument();
    expect(signedInAppRenderMock).not.toHaveBeenCalled();
    expect(dashboardRenderMock).not.toHaveBeenCalled();
  });

  it('shows encryption setup before loading signed-in app for remembered signed-in user', async () => {
    localStorage.setItem(
      'autokpo:session',
      JSON.stringify({
        userId: 'user-1',
        email: 'user@example.com',
        image: null,
      }),
    );

    renderRouter('/dashboard');

    expect(
      await screen.findByText('Podesite šifru za šifrovanje'),
    ).toBeInTheDocument();
    expect(signedInAppRenderMock).not.toHaveBeenCalled();
    expect(dashboardRenderMock).not.toHaveBeenCalled();
  });

  it('loads signed-in app and dashboard route for unlocked remembered user', async () => {
    localStorage.setItem(
      'autokpo:session',
      JSON.stringify({
        userId: 'user-1',
        email: 'user@example.com',
        image: null,
      }),
    );
    localStorage.setItem(
      'autokpo:e2ee:profile:user-1',
      JSON.stringify({ version: 1, verifier: 'secret123' }),
    );
    sessionStorage.setItem(
      LOCAL_ENCRYPTION_UNLOCK_KEY,
      JSON.stringify({
        version: 1,
        userId: 'user-1',
        unlockedAt: '2026-01-01T00:00:00.000Z',
      }),
    );

    renderRouter('/dashboard');

    expect(await screen.findByText('Lazy dashboard')).toBeInTheDocument();
    expect(signedInAppRenderMock).toHaveBeenCalled();
    expect(dashboardRenderMock).toHaveBeenCalled();
  });
});

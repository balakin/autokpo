import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { use } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '../auth-context';
import { AuthProvider } from '../auth-provider';

const signOutMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock('../auth-client', () => ({
  authClient: {
    getSession: getSessionMock,
    signOut: signOutMock,
  },
}));

function Harness() {
  const auth = use(AuthContext);
  if (!auth) throw new Error('missing auth context');
  return (
    <>
      <span data-testid="userId">{auth.user?.id ?? 'null'}</span>
      <span data-testid="email">{auth.user?.email ?? 'null'}</span>
      <span data-testid="image">{auth.user?.image ?? 'null'}</span>
      <button onClick={() => void auth.logout()}>logout</button>
    </>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    signOutMock.mockReset();
    getSessionMock.mockReset();
    signOutMock.mockResolvedValue(undefined);
    getSessionMock.mockResolvedValue({ data: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes signed out when no remembered user', () => {
    getSessionMock.mockImplementation(() => new Promise(() => {}));
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );
    expect(screen.getByTestId('userId')).toHaveTextContent('null');
  });

  it('initializes signed in from remembered user in localStorage', () => {
    getSessionMock.mockImplementation(() => new Promise(() => {}));
    localStorage.setItem(
      'autokpo:session',
      JSON.stringify({
        userId: 'remembered-user',
        email: 'remembered@example.com',
        image: null,
      }),
    );
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );
    expect(screen.getByTestId('userId')).toHaveTextContent('remembered-user');
    expect(screen.getByTestId('email')).toHaveTextContent(
      'remembered@example.com',
    );
    expect(screen.getByTestId('image')).toHaveTextContent('null');
  });

  it('refreshSession updates userId', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'user-1@example.com',
          image: 'https://img.example.com/u1.png',
        },
      },
    });
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('userId')).toHaveTextContent('user-1'),
    );
    expect(localStorage.getItem('autokpo:session')).toBe(
      JSON.stringify({
        userId: 'user-1',
        email: 'user-1@example.com',
        image: 'https://img.example.com/u1.png',
        imageStatus: 'ready',
      }),
    );
  });

  it('logout clears remembered user', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'autokpo:session',
      JSON.stringify({
        userId: 'remembered-user',
        email: 'remembered@example.com',
        image: null,
      }),
    );
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await user.click(screen.getByText('logout'));
    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));

    expect(localStorage.getItem('autokpo:session')).toBeNull();
  });

  it('reacts to cross-tab storage updates', () => {
    getSessionMock.mockImplementation(() => new Promise(() => {}));
    sessionStorage.setItem(
      'autokpo:e2ee:local-unlock',
      JSON.stringify({
        version: 1,
        userId: 'previous-user',
        unlockedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    act(() => {
      localStorage.setItem(
        'autokpo:session',
        JSON.stringify({
          userId: 'leader-user',
          email: 'leader@example.com',
          image: null,
        }),
      );
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'autokpo:session',
          newValue: JSON.stringify({
            userId: 'leader-user',
            email: 'leader@example.com',
            image: null,
          }),
        }),
      );
    });

    expect(screen.getByTestId('userId')).toHaveTextContent('leader-user');
    expect(screen.getByTestId('email')).toHaveTextContent('leader@example.com');
    expect(sessionStorage.getItem('autokpo:e2ee:local-unlock')).toBeNull();
  });

  it('polls until importing image status becomes ready', async () => {
    vi.useFakeTimers();
    getSessionMock
      .mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-1',
            email: 'user-1@example.com',
            image: 'https://img.example.com/u1.png',
            imageStatus: 'importing',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-1',
            email: 'user-1@example.com',
            image: 'https://img.example.com/u1.png',
            imageStatus: 'ready',
          },
        },
      });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(getSessionMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
      await Promise.resolve();
    });

    expect(getSessionMock).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('image')).toHaveTextContent('u1.png');
    expect(localStorage.getItem('autokpo:session')).toContain(
      '"imageStatus":"ready"',
    );
    vi.useRealTimers();
  });
});

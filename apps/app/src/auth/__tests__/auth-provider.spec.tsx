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
  });

  it('refreshSession updates userId', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'user-1@example.com',
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
        }),
      );
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'autokpo:session',
          newValue: JSON.stringify({
            userId: 'leader-user',
            email: 'leader@example.com',
          }),
        }),
      );
    });

    expect(screen.getByTestId('userId')).toHaveTextContent('leader-user');
    expect(screen.getByTestId('email')).toHaveTextContent('leader@example.com');
  });
});

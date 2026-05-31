import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionSync } from '../session-sync';
import { useAuth } from '../use-auth';

const signOutMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock('../auth-client', () => ({
  authClient: {
    getSession: getSessionMock,
    signOut: signOutMock,
  },
}));

vi.mock('../../e2ee/cleanup', () => ({
  clearLocalEncryptionUnlockMaterial: vi.fn(),
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function Harness() {
  const { user, logout } = useAuth();
  return (
    <>
      <span data-testid="userId">{user?.id ?? 'null'}</span>
      <span data-testid="email">{user?.email ?? 'null'}</span>
      <button onClick={() => void logout()}>logout</button>
    </>
  );
}

function TestApp({ queryClient }: { queryClient: QueryClient }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionSync />
      <Harness />
    </QueryClientProvider>
  );
}

describe('useAuth + SessionSync', () => {
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
    const queryClient = makeQueryClient();
    render(<TestApp queryClient={queryClient} />);
    expect(screen.getByTestId('userId')).toHaveTextContent('null');
  });

  it('initializes signed in from remembered user in localStorage', () => {
    getSessionMock.mockImplementation(() => new Promise(() => {}));
    localStorage.setItem(
      'autokpo:session',
      JSON.stringify({
        userId: 'remembered-user',
        email: 'remembered@example.com',
        sessionId: null,
      }),
    );
    const queryClient = makeQueryClient();
    render(<TestApp queryClient={queryClient} />);
    expect(screen.getByTestId('userId')).toHaveTextContent('remembered-user');
    expect(screen.getByTestId('email')).toHaveTextContent(
      'remembered@example.com',
    );
  });

  it('background fetch updates userId', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'user-1@example.com' },
        session: { id: 'session-1', token: 'tok-1' },
      },
    });
    const queryClient = makeQueryClient();
    render(<TestApp queryClient={queryClient} />);
    await waitFor(() =>
      expect(screen.getByTestId('userId')).toHaveTextContent('user-1'),
    );
    expect(localStorage.getItem('autokpo:session')).toBe(
      JSON.stringify({
        userId: 'user-1',
        email: 'user-1@example.com',
        sessionId: 'session-1',
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
        sessionId: null,
      }),
    );
    const queryClient = makeQueryClient();
    render(<TestApp queryClient={queryClient} />);

    await user.click(screen.getByText('logout'));
    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));

    expect(localStorage.getItem('autokpo:session')).toBeNull();
  });

  it('reacts to cross-tab storage updates', async () => {
    getSessionMock.mockImplementation(() => new Promise(() => {}));
    const queryClient = makeQueryClient();
    render(<TestApp queryClient={queryClient} />);

    localStorage.setItem(
      'autokpo:session',
      JSON.stringify({
        userId: 'leader-user',
        email: 'leader@example.com',
        sessionId: null,
      }),
    );
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'autokpo:session',
        newValue: JSON.stringify({
          id: 'leader-user',
          email: 'leader@example.com',
          sessionId: null,
        }),
      }),
    );

    await waitFor(() =>
      expect(screen.getByTestId('userId')).toHaveTextContent('leader-user'),
    );
    expect(screen.getByTestId('email')).toHaveTextContent('leader@example.com');
  });
});

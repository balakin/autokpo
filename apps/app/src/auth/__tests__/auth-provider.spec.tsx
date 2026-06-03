import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionSync } from '../session-sync';
import { useAuth } from '../use-auth';
import { SESSION_QUERY_KEY } from '../use-session-query';

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

vi.mock('../../query-client', () => ({
  clearQueriesCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../session-broadcast', () => ({
  broadcastSessionChange: vi.fn(),
  subscribeToSessionChanges: vi.fn().mockReturnValue(() => {}),
}));

function makeQueryClient(initialUserId?: string | null) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  if (initialUserId !== undefined) {
    qc.setQueryData(
      SESSION_QUERY_KEY,
      initialUserId
        ? { id: initialUserId, email: 'u@example.com', sessionId: null }
        : null,
    );
  }
  return qc;
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
    signOutMock.mockReset();
    getSessionMock.mockReset();
    signOutMock.mockResolvedValue(undefined);
    getSessionMock.mockResolvedValue({ data: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads session from React Query cache', () => {
    const queryClient = makeQueryClient('cached-user');
    render(<TestApp queryClient={queryClient} />);
    expect(screen.getByTestId('userId')).toHaveTextContent('cached-user');
  });

  it('returns null user when no session in cache', () => {
    const queryClient = makeQueryClient(null);
    render(<TestApp queryClient={queryClient} />);
    expect(screen.getByTestId('userId')).toHaveTextContent('null');
  });

  it('session query fetches and updates userId', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'user-1@example.com' },
        session: { id: 'session-1', token: 'tok-1' },
      },
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    render(<TestApp queryClient={queryClient} />);
    await waitFor(() =>
      expect(screen.getByTestId('userId')).toHaveTextContent('user-1'),
    );
  });

  it('logout clears React Query session cache', async () => {
    const user = userEvent.setup();
    const queryClient = makeQueryClient('remembered-user');
    render(<TestApp queryClient={queryClient} />);

    await user.click(screen.getByText('logout'));
    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));

    expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
  });
});

describe('SessionSync via BroadcastChannel', () => {
  it('exposes subscribeToSessionChanges for cross-tab updates', async () => {
    const { subscribeToSessionChanges } = await import('../session-broadcast');
    const queryClient = makeQueryClient(null);
    render(<TestApp queryClient={queryClient} />);

    expect(subscribeToSessionChanges).toHaveBeenCalled();
  });
});

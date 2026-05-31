import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionSync } from '../session-sync';
import { SESSION_QUERY_KEY, type SessionData } from '../use-session-query';

const getSessionMock = vi.hoisted(() => vi.fn());
const subscribeToSessionChangesMock = vi.hoisted(() => vi.fn());

vi.mock('../auth-client', () => ({
  authClient: { getSession: getSessionMock },
}));

vi.mock('../../e2ee/cleanup', () => ({
  clearLocalEncryptionUnlockMaterial: vi.fn(),
}));

vi.mock('../../pwa/clear-protected-caches', () => ({
  clearProtectedCaches: vi.fn().mockResolvedValue(undefined),
}));

let broadcastHandler: ((session: SessionData | null) => void) | null = null;

vi.mock('../session-broadcast', () => ({
  subscribeToSessionChanges: subscribeToSessionChangesMock.mockImplementation(
    (handler: (session: SessionData | null) => void) => {
      broadcastHandler = handler;
      return () => {
        broadcastHandler = null;
      };
    },
  ),
}));

function makeQueryClient(initialSession: SessionData | null = null) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 30_000 } },
  });
  qc.setQueryData(SESSION_QUERY_KEY, initialSession);
  return qc;
}

describe('SessionSync — BroadcastChannel session propagation', () => {
  beforeEach(() => {
    broadcastHandler = null;
    getSessionMock.mockReset();
    subscribeToSessionChangesMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers a BroadcastChannel subscription on mount', () => {
    const queryClient = makeQueryClient(null);

    render(
      <QueryClientProvider client={queryClient}>
        <SessionSync />
      </QueryClientProvider>,
    );

    expect(subscribeToSessionChangesMock).toHaveBeenCalled();
  });

  it('clears React Query when broadcast receives logout (userId null)', async () => {
    const queryClient = makeQueryClient({
      id: 'user-1',
      email: null,
      sessionId: null,
    });
    queryClient.setQueryData(['other-query'], 'cached');

    render(
      <QueryClientProvider client={queryClient}>
        <SessionSync />
      </QueryClientProvider>,
    );

    expect(broadcastHandler).not.toBeNull();
    broadcastHandler!(null);

    await waitFor(() => {
      expect(queryClient.getQueryData(SESSION_QUERY_KEY)).toBeNull();
      expect(queryClient.getQueryData(['other-query'])).toBeUndefined();
    });
  });

  it('triggers session refetch when broadcast receives login (userId non-null)', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        user: { id: 'user-2', email: 'u2@example.com' },
        session: { id: 's1' },
      },
    });
    const queryClient = makeQueryClient(null);

    render(
      <QueryClientProvider client={queryClient}>
        <SessionSync />
      </QueryClientProvider>,
    );

    expect(broadcastHandler).not.toBeNull();
    broadcastHandler!({
      id: 'user-2',
      email: null,
      sessionId: null,
    });

    await waitFor(() => {
      const session = queryClient.getQueryData(SESSION_QUERY_KEY) as {
        id: string;
      } | null;
      expect(session?.id).toBe('user-2');
    });
  });
});

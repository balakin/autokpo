import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type * as SyncClient from '../sync-client';
import { SyncRequestError } from '../sync-client';
import { useSyncEngine } from '../use-sync-engine';

vi.mock('../../e2ee/encryption-context', () => ({
  useEncryptionContext: () => ({
    masterKey: new Uint8Array(32).fill(1),
    keyId: 'key-1',
  }),
}));

const logoutMock = vi.hoisted(() => vi.fn());
const pullMock = vi.hoisted(() => vi.fn());

vi.mock('../../auth/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'user@example.com', image: null },
    logout: logoutMock,
  }),
}));

vi.mock('../../leader', () => ({
  useLeader: () => ({ isLeader: true }),
}));

vi.mock('../use-doc', () => ({
  useDoc: () => ({ on: vi.fn(), off: vi.fn() }),
}));

vi.mock('../sync-metadata-context', () => ({
  useSyncMetadataStore: () => ({
    read: () => ({ cursor: 0, stateVector: null, dirty: false }),
    write: vi.fn(),
    reset: vi.fn(),
    markDirty: vi.fn(),
  }),
}));

vi.mock('../sync-client', async (importOriginal) => {
  const actual = await importOriginal<typeof SyncClient>();
  return {
    ...actual,
    pull: pullMock,
    push: vi.fn(),
    compact: vi.fn(),
  };
});

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useQuery: ({ queryFn }: { queryFn: () => Promise<unknown> }) => {
    void queryFn();
    return {};
  },
  useMutation: () => ({ mutateAsync: vi.fn() }),
}));

function Harness({ children }: { children?: ReactNode }) {
  useSyncEngine();
  return <>{children}</>;
}

describe('useSyncEngine auth rejection handling', () => {
  it('publishes logout request on unauthorized pull', async () => {
    pullMock.mockRejectedValueOnce(
      new SyncRequestError(401, 'unauthorized', 'pull failed: 401'),
    );

    render(<Harness />);

    await Promise.resolve();
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});

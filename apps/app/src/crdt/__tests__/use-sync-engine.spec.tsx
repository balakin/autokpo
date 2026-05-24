import { render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';

import type { EncryptedIndexeddbPersistence } from '../encrypted-indexeddb-persistence';
import type * as SyncClient from '../sync-client';
import { SyncRequestError } from '../sync-client';
import { encryptSyncPayload } from '../sync-logic';
import { useSyncEngine } from '../use-sync-engine';

vi.mock('../../e2ee/encryption-context', () => ({
  useEncryptionContext: () => ({
    activeDek: new Uint8Array(32).fill(1),
    activeDekId: 'dek-1',
  }),
}));

const logoutMock = vi.hoisted(() => vi.fn());
const pullMock = vi.hoisted(() => vi.fn());
const syncWriteMock = vi.hoisted(() => vi.fn());
const docRef = vi.hoisted(() => ({ current: null as Y.Doc | null }));

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
  useDoc: () => docRef.current,
}));

vi.mock('../sync-metadata-context', () => ({
  useSyncMetadataStore: () => ({
    read: () => ({ cursor: 0, stateVector: null, dirty: false }),
    write: syncWriteMock,
    reset: vi.fn(),
    markDirty: vi.fn(),
  }),
}));

vi.mock('../bus', () => ({
  post: vi.fn(),
  subscribe: vi.fn(() => () => {}),
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

beforeEach(() => {
  logoutMock.mockClear();
  pullMock.mockReset();
  syncWriteMock.mockClear();
});

function Harness({
  children,
  persistence,
}: {
  children?: ReactNode;
  persistence?: EncryptedIndexeddbPersistence;
}) {
  useSyncEngine(persistence);
  return <>{children}</>;
}

describe('useSyncEngine auth rejection handling', () => {
  it('publishes logout request on unauthorized pull', async () => {
    docRef.current = new Y.Doc();
    pullMock.mockRejectedValueOnce(
      new SyncRequestError(401, 'unauthorized', 'pull failed: 401'),
    );

    render(<Harness />);

    await Promise.resolve();
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it('persists pulled records before advancing the cursor', async () => {
    docRef.current = new Y.Doc();
    const plaintext = Y.encodeStateAsUpdate(new Y.Doc());
    const payload = await encryptSyncPayload({
      plaintext,
      activeDek: new Uint8Array(32).fill(1),
      userId: 'user-1',
      activeDekId: 'dek-1',
      blockId: 'block-1',
      kind: 'update',
    });
    const persistRemoteUpdates = vi.fn(() => {
      expect(syncWriteMock).not.toHaveBeenCalled();
      return Promise.resolve();
    });
    pullMock.mockResolvedValueOnce({
      records: [
        {
          id: 'block-1',
          kind: 'update',
          encryptionKeyId: 'dek-1',
          encryptionAlgorithm: payload.encryptionAlgorithm,
          encryptionVersion: payload.encryptionVersion,
          iv: payload.iv,
          ciphertext: payload.ciphertext,
        },
      ],
      head: 1,
      status: 200,
    });

    render(
      <Harness
        persistence={
          {
            persistRemoteUpdates,
          } as unknown as EncryptedIndexeddbPersistence
        }
      />,
    );

    await waitFor(() => expect(syncWriteMock).toHaveBeenCalled());
    expect(persistRemoteUpdates).toHaveBeenCalledWith([plaintext]);
  });
});

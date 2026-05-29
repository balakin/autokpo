import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EncryptionContextValue } from '../../e2ee/encryption-context';
import { CrdtProvider } from '../crdt-provider';

const createRuntimeMock = vi.hoisted(() => vi.fn());
const bootstrapMock = vi.hoisted(() => vi.fn());
const useEncryptionContextMock = vi.hoisted(() => vi.fn());
const useSyncEngineMock = vi.hoisted(() => vi.fn());
const resetSyncStateMock = vi.hoisted(() => vi.fn());

vi.mock('../doc', () => ({
  bootstrap: bootstrapMock,
  createRuntime: createRuntimeMock,
}));

vi.mock('../../e2ee/encryption-context', () => ({
  useEncryptionContext: useEncryptionContextMock,
}));

vi.mock('../crdt-locale-provider', () => ({
  CrdtLocaleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../sync-metadata-provider', () => ({
  SyncMetadataProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

vi.mock('../use-sync-engine', () => ({
  useSyncEngine: useSyncEngineMock,
}));

vi.mock('../sync-state', () => ({
  resetSyncState: resetSyncStateMock,
}));

vi.mock('../../i18n/locale-storage', () => ({
  getStoredLocale: () => 'sr-Latn',
}));

function makeContext(overrides: Partial<EncryptionContextValue> = {}) {
  return {
    mek: new Uint8Array(32).fill(1),
    activeDek: new Uint8Array(32).fill(2),
    activeDekId: 'dek-1',
    keyRingId: 'key-ring-1',
    keyRingRevision: 1,
    deks: {},
    getDek: vi.fn(),
    clearEncryptionSession: vi.fn(),
    refreshKeyRingProfile: vi.fn(),
    updateKeyRingProfile: vi.fn(),
    ...overrides,
  } satisfies EncryptionContextValue;
}

function makeRuntime() {
  return {
    persistence: {},
    ydoc: {},
    whenReady: Promise.resolve(),
    persistSnapshot: vi.fn(),
    destroy: vi.fn().mockResolvedValue(undefined),
  };
}

describe('CrdtProvider runtime lifecycle', () => {
  beforeEach(() => {
    createRuntimeMock.mockReset();
    bootstrapMock.mockReset().mockReturnValue(false);
    useEncryptionContextMock.mockReset();
    useSyncEngineMock.mockReset();
    resetSyncStateMock.mockReset();
  });

  it('keeps the local runtime mounted when only the remote active DEK changes', async () => {
    const runtime = makeRuntime();
    let context = makeContext();
    useEncryptionContextMock.mockImplementation(() => context);
    createRuntimeMock.mockReturnValue(runtime);

    const { rerender } = render(
      <CrdtProvider userId="user-1">
        <span data-testid="child">ready</span>
      </CrdtProvider>,
    );
    await screen.findByTestId('child');

    context = makeContext({
      mek: context.mek,
      activeDek: new Uint8Array(32).fill(3),
      activeDekId: 'dek-2',
      keyRingRevision: 2,
    });
    rerender(
      <CrdtProvider userId="user-1">
        <span data-testid="child">ready</span>
      </CrdtProvider>,
    );

    expect(createRuntimeMock).toHaveBeenCalledTimes(1);
    expect(runtime.destroy).not.toHaveBeenCalled();
    expect(useSyncEngineMock).toHaveBeenLastCalledWith(runtime.persistence);
  });

  it('recreates the local runtime when the MEK changes', async () => {
    const firstRuntime = makeRuntime();
    const secondRuntime = makeRuntime();
    let context = makeContext();
    useEncryptionContextMock.mockImplementation(() => context);
    createRuntimeMock
      .mockReturnValueOnce(firstRuntime)
      .mockReturnValueOnce(secondRuntime);

    const { rerender } = render(
      <CrdtProvider userId="user-1">
        <span data-testid="child">ready</span>
      </CrdtProvider>,
    );
    await screen.findByTestId('child');

    context = makeContext({ mek: new Uint8Array(32).fill(9) });
    rerender(
      <CrdtProvider userId="user-1">
        <span data-testid="child">ready</span>
      </CrdtProvider>,
    );

    await waitFor(() => expect(createRuntimeMock).toHaveBeenCalledTimes(2));
    expect(firstRuntime.destroy).toHaveBeenCalledTimes(1);
  });
});

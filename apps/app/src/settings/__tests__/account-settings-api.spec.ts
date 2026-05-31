import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteAccount,
  fetchAccountSessions,
  revokeAccountSession,
  revokeOtherAccountSessions,
} from '../account-settings-api';

const mockDeleteUser = vi.fn<(options: unknown) => Promise<unknown>>();
const mockListSessions = vi.fn<() => Promise<unknown>>();
const mockRevokeSession = vi.fn<(payload: unknown) => Promise<unknown>>();
const mockRevokeOtherSessions = vi.fn<() => Promise<unknown>>();
const mockClearProtectedCaches = vi.fn<() => Promise<void>>();
const mockClearLocalEncryptionUnlockMaterial =
  vi.fn<(userId: string) => void>();
const mockBroadcastSessionChange = vi.fn<(userId: string | null) => void>();

vi.mock('../../auth/auth-client', () => ({
  authClient: {
    deleteUser: (options: unknown) => mockDeleteUser(options),
    listSessions: () => mockListSessions(),
    revokeSession: (payload: unknown) => mockRevokeSession(payload),
    revokeOtherSessions: () => mockRevokeOtherSessions(),
  },
}));

vi.mock('../../pwa/clear-protected-caches', () => ({
  clearProtectedCaches: () => mockClearProtectedCaches(),
}));

vi.mock('../../e2ee/cleanup', () => ({
  clearLocalEncryptionUnlockMaterial: (userId: string) =>
    mockClearLocalEncryptionUnlockMaterial(userId),
}));

vi.mock('../../auth/session-broadcast', () => ({
  broadcastSessionChange: (userId: string | null) =>
    mockBroadcastSessionChange(userId),
}));

describe('account settings API', () => {
  beforeEach(() => {
    mockDeleteUser.mockReset();
    mockDeleteUser.mockResolvedValue({ data: { success: true } });
    mockListSessions.mockReset();
    mockListSessions.mockResolvedValue({ data: [] });
    mockRevokeSession.mockReset();
    mockRevokeSession.mockResolvedValue({ data: { success: true } });
    mockRevokeOtherSessions.mockReset();
    mockRevokeOtherSessions.mockResolvedValue({ data: { success: true } });
    mockClearProtectedCaches.mockReset();
    mockClearProtectedCaches.mockResolvedValue(undefined);
    mockClearLocalEncryptionUnlockMaterial.mockReset();
    mockBroadcastSessionChange.mockReset();
    localStorage.setItem('autokpo:locale', 'en');
  });

  it('deletes the account, clears protected caches, clears local key material, and broadcasts logout', async () => {
    await deleteAccount('user-1');

    expect(mockDeleteUser).toHaveBeenCalledWith({
      fetchOptions: {
        headers: { 'X-Preferred-Locale': 'en' },
      },
    });
    expect(mockClearProtectedCaches).toHaveBeenCalledTimes(1);
    expect(mockClearLocalEncryptionUnlockMaterial).toHaveBeenCalledWith(
      'user-1',
    );
    expect(mockBroadcastSessionChange).toHaveBeenCalledWith(null);
  });

  it('does not clear caches or broadcast when deletion fails', async () => {
    mockDeleteUser.mockResolvedValue({ error: { message: 'Nope' } });

    await expect(deleteAccount('user-1')).rejects.toThrow('Nope');

    expect(mockClearProtectedCaches).not.toHaveBeenCalled();
    expect(mockClearLocalEncryptionUnlockMaterial).not.toHaveBeenCalled();
    expect(mockBroadcastSessionChange).not.toHaveBeenCalled();
  });

  it('normalizes account sessions', async () => {
    mockListSessions.mockResolvedValue({
      data: [
        {
          id: 'current-session',
          token: 'current-token',
          ipAddress: '203.0.113.10',
          userAgent: 'Chrome on Linux',
          createdAt: '2026-05-01T08:00:00.000Z',
          updatedAt: '2026-05-01T10:00:00.000Z',
          expiresAt: '2026-06-01T10:00:00.000Z',
        },
        {
          id: 'other-session',
          token: 'other-token',
        },
      ],
    });

    await expect(fetchAccountSessions()).resolves.toEqual([
      {
        id: 'current-session',
        token: 'current-token',
        ipAddress: '203.0.113.10',
        userAgent: 'Chrome on Linux',
        createdAt: Date.parse('2026-05-01T08:00:00.000Z'),
        expiresAt: Date.parse('2026-06-01T10:00:00.000Z'),
      },
      {
        id: 'other-session',
        token: 'other-token',
        ipAddress: null,
        userAgent: null,
        createdAt: null,
        expiresAt: null,
      },
    ]);
  });

  it('revokes one account session by token', async () => {
    await revokeAccountSession('other-token');

    expect(mockRevokeSession).toHaveBeenCalledWith({ token: 'other-token' });
  });

  it('revokes other account sessions', async () => {
    await revokeOtherAccountSessions();

    expect(mockRevokeOtherSessions).toHaveBeenCalledTimes(1);
  });
});

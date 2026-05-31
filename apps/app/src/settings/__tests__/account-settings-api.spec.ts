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
const mockLocationAssign = vi.fn<(url: string) => void>();

vi.mock('../../auth/auth-client', () => ({
  authClient: {
    deleteUser: (options: unknown) => mockDeleteUser(options),
    listSessions: () => mockListSessions(),
    revokeSession: (payload: unknown) => mockRevokeSession(payload),
    revokeOtherSessions: () => mockRevokeOtherSessions(),
  },
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
    mockLocationAssign.mockReset();
    vi.stubGlobal('location', {
      ...window.location,
      assign: mockLocationAssign,
    });
    localStorage.clear();
    localStorage.setItem('autokpo:locale', 'en');
  });

  it('deletes the account, clears the stored session, and reloads to goodbye', async () => {
    localStorage.setItem(
      'autokpo:session',
      JSON.stringify({ userId: 'user-1', email: null, sessionId: null }),
    );

    await deleteAccount();

    expect(mockDeleteUser).toHaveBeenCalledWith({
      fetchOptions: {
        headers: { 'X-Preferred-Locale': 'en' },
      },
    });
    expect(localStorage.getItem('autokpo:session')).toBeNull();
    expect(mockLocationAssign).toHaveBeenCalledWith('/goodbye');
  });

  it('does not clear storage or reload when deletion fails', async () => {
    localStorage.setItem(
      'autokpo:session',
      JSON.stringify({ userId: 'user-1', email: null, sessionId: null }),
    );
    mockDeleteUser.mockResolvedValue({ error: { message: 'Nope' } });

    await expect(deleteAccount()).rejects.toThrow('Nope');

    expect(localStorage.getItem('autokpo:session')).toBe(
      JSON.stringify({ userId: 'user-1', email: null, sessionId: null }),
    );
    expect(mockLocationAssign).not.toHaveBeenCalled();
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

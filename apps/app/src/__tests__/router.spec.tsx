import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router';
import { I18nWrapper } from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SerializedEncryptionKeyRecord } from '../e2ee/encryption-key-record';
import { createAppRoutes } from '../router';

const getSessionMock = vi.hoisted(() => vi.fn());
const signedInAppRenderMock = vi.hoisted(() => vi.fn());
const dashboardRenderMock = vi.hoisted(() => vi.fn());
const unwrapMasterKeyMock = vi.hoisted(() => vi.fn());

vi.mock('../auth/auth-client', () => ({
  authClient: {
    getSession: getSessionMock,
    signIn: {
      social: vi.fn(),
      emailOtp: vi.fn(),
    },
    emailOtp: {
      sendVerificationOtp: vi.fn(),
    },
    signOut: vi.fn(),
  },
}));

vi.mock('../signed-in-app', () => ({
  SignedInApp: () => {
    signedInAppRenderMock();
    return <Outlet />;
  },
}));

vi.mock('../dashboard/dashboard-page', () => ({
  DashboardPage: () => {
    dashboardRenderMock();
    return <div>Lazy dashboard</div>;
  },
}));

vi.mock('../e2ee/encryption-crypto', () => ({
  createWrappedMasterKey: vi.fn(),
  unwrapMasterKey: unwrapMasterKeyMock,
}));

function renderRouter(initialEntry: string) {
  const router = createMemoryRouter(createAppRoutes(), {
    initialEntries: [initialEntry],
  });

  render(
    <I18nWrapper>
      <RouterProvider router={router} />
    </I18nWrapper>,
  );
}

function makeRecord(userId = 'user-1'): SerializedEncryptionKeyRecord {
  return {
    version: 1,
    key: {
      id: 'key-1',
      userId,
      createdAt: '2026-01-01T00:00:00.000Z',
      revokedAt: null,
    },
    wrapping: {
      id: 'wrapping-1',
      keyId: 'key-1',
      userId,
      method: 'password',
      kdfVersion: 1,
      kdfAlgorithm: 'argon2id',
      kdfParams: {
        memorySize: 65536,
        iterations: 3,
        parallelism: 1,
        hashLength: 32,
      },
      kdfSalt: 'AAAAAAAAAAAAAAAAAAAAAA==',
      wrapVersion: 1,
      wrapAlgorithm: 'aes-256-gcm',
      wrapParams: { ivBytes: 12, tagBits: 128 },
      wrapIv: 'AAAAAAAAAAAAAAAA',
      wrappedMasterKey:
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      createdAt: '2026-01-01T00:00:00.000Z',
      revokedAt: null,
    },
  };
}

function cacheRecord(record = makeRecord()) {
  localStorage.setItem(
    `autokpo:e2ee:wrapped-key:${record.key.userId}`,
    JSON.stringify(record),
  );
}

describe('router bundle boundaries', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('autokpo:locale', 'sr-Latn');
    getSessionMock.mockReset();
    getSessionMock.mockImplementation(() => new Promise(() => {}));
    signedInAppRenderMock.mockClear();
    dashboardRenderMock.mockClear();
    unwrapMasterKeyMock.mockReset();
    unwrapMasterKeyMock.mockResolvedValue(new Uint8Array(32).fill(1));
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ code: 'encryption_key_not_found' }, { status: 404 }),
        ),
    );
  });

  it('redirects a signed-out protected-route visit before loading signed-in app', async () => {
    renderRouter('/dashboard');

    expect(await screen.findByText('Dobrodošli')).toBeInTheDocument();
    expect(signedInAppRenderMock).not.toHaveBeenCalled();
    expect(dashboardRenderMock).not.toHaveBeenCalled();
  });

  it('shows encryption setup before loading signed-in app for remembered signed-in user', async () => {
    localStorage.setItem(
      'autokpo:session',
      JSON.stringify({
        userId: 'user-1',
        email: 'user@example.com',
        image: null,
      }),
    );

    renderRouter('/dashboard');

    expect(
      await screen.findByText('Podesite šifru za šifrovanje'),
    ).toBeInTheDocument();
    expect(signedInAppRenderMock).not.toHaveBeenCalled();
    expect(dashboardRenderMock).not.toHaveBeenCalled();
  });

  it('loads signed-in app and dashboard route for unlocked remembered user', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'autokpo:session',
      JSON.stringify({
        userId: 'user-1',
        email: 'user@example.com',
        image: null,
      }),
    );
    cacheRecord();

    renderRouter('/dashboard');

    await user.type(
      await screen.findByLabelText(/Šifra za šifrovanje/i),
      'secret123',
    );
    await user.click(
      screen.getByRole('button', { name: /Otključaj podatke/i }),
    );

    expect(await screen.findByText('Lazy dashboard')).toBeInTheDocument();
    expect(signedInAppRenderMock).toHaveBeenCalled();
    expect(dashboardRenderMock).toHaveBeenCalled();
  });
});

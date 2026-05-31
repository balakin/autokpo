import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router';
import { I18nWrapper } from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SerializedKeyRingProfile } from '../e2ee/key-ring-record';
import { createAppRoutes } from '../router';

const getSessionMock = vi.hoisted(() => vi.fn());
const signedInAppRenderMock = vi.hoisted(() => vi.fn());
const dashboardRenderMock = vi.hoisted(() => vi.fn());
const unwrapKeyRingProfileMock = vi.hoisted(() => vi.fn());

vi.mock('../e2ee/cleanup', () => ({
  clearLocalEncryptionUnlockMaterial: vi.fn(),
}));

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
  createKeyRingProfilePayload: vi.fn(),
  unwrapKeyRingProfile: unwrapKeyRingProfileMock,
  generateLdk: vi.fn().mockResolvedValue({}),
  wrapMekWithLdk: vi.fn().mockResolvedValue({
    ciphertext: new Uint8Array(48),
    iv: new Uint8Array(12),
  }),
  unwrapMekWithLdk: vi.fn(),
  decryptKeyRingWithMek: vi.fn(),
  wrappedMekAad: () => new Uint8Array(0),
  EncryptionUnlockError: class EncryptionUnlockError extends Error {
    constructor() {
      super('unlock failed');
      this.name = 'EncryptionUnlockError';
    }
  },
}));

function renderRouter(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const router = createMemoryRouter(createAppRoutes(), {
    initialEntries: [initialEntry],
  });

  render(
    <QueryClientProvider client={queryClient}>
      <I18nWrapper>
        <RouterProvider router={router} />
      </I18nWrapper>
    </QueryClientProvider>,
  );
}

function makeRecord(userId = 'user-1'): SerializedKeyRingProfile {
  return {
    keyRing: {
      id: 'key-ring-1',
      userId,
      activeDekId: 'dek-1',
      revision: 1,
      plaintextSchemaVersion: 1,
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionParams: { iv: 'AAAAAAAAAAAAAAAA', tagBits: 128 },
      ciphertext:
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    wrappers: [
      {
        id: 'wrapping-1',
        userId,
        method: 'password',
        kdfAlgorithm: 'argon2id',
        kdfParams: {
          memorySize: 65536,
          iterations: 3,
          parallelism: 1,
          hashLength: 32,
        },
        kdfSalt: 'AAAAAAAAAAAAAAAAAAAAAA==',
        wrappingAlgorithm: 'aes-256-gcm',
        wrappingParams: { iv: 'AAAAAAAAAAAAAAAA', tagBits: 128 },
        ciphertext:
          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  };
}

function cacheRecord(record = makeRecord()) {
  localStorage.setItem(
    `autokpo:e2ee:key-ring:${record.keyRing.userId}`,
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
    unwrapKeyRingProfileMock.mockReset();
    unwrapKeyRingProfileMock.mockResolvedValue({
      mek: new Uint8Array(32).fill(2),
      activeDek: new Uint8Array(32).fill(1),
      activeDekId: 'dek-1',
      revision: 1,
      deks: { 'dek-1': new Uint8Array(32).fill(1) },
    });
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
        sessionId: null,
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
        sessionId: null,
      }),
    );
    cacheRecord();
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(Response.json(makeRecord())),
    );

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

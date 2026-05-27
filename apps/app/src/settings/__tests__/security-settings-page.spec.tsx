import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SecuritySettingsPage } from '../security-settings-page';

const mockClearEncryptionSession = vi.fn();
const mockRefreshKeyRingProfile = vi.fn<() => Promise<void>>();
const mockFetchKeyRingProfile = vi.fn<() => Promise<Profile>>();
const mockChangeMasterPassword = vi.fn<() => Promise<void>>();
const mockCreatePasswordWrapperPayload = vi.fn<() => Promise<object>>();
const mockUnwrapKeyRingProfile = vi.fn<() => Promise<object>>();
const mockUnwrapMekWithPin = vi.fn<() => Promise<Uint8Array>>();
const mockUpdatePinFailedAttempts = vi.fn<() => Promise<void>>();
const mockDeleteLocalWrapper = vi.fn<() => Promise<void>>();

let localWrapper: { method: 'ldk' | 'pin'; failedAttempts?: number } | null;

type Profile = {
  keyRing: {
    id: string;
    userId: string;
    activeDekId: string;
    revision: number;
    encryptionVersion: 1;
    encryptionAlgorithm: 'aes-256-gcm';
    iv: string;
    ciphertext: string;
    createdAt: string;
    updatedAt: string;
  };
  wrappers: Array<{
    id: string;
    userId: string;
    method: 'password';
    kdfVersion: 1;
    kdfAlgorithm: 'argon2id';
    kdfParams: {
      memorySize: number;
      iterations: number;
      parallelism: number;
      hashLength: number;
    };
    kdfSalt: string;
    wrappingVersion: 1;
    wrappingAlgorithm: 'aes-256-gcm';
    wrappingParams: { ivBytes: number; tagBits: number };
    wrappingIv: string;
    ciphertext: string;
    createdAt: string;
  }>;
};

vi.mock('../../auth/use-auth', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));

vi.mock('../../e2ee/encryption-context', () => ({
  useEncryptionContext: () => ({
    mek: new Uint8Array(32).fill(1),
    activeDek: new Uint8Array(32).fill(2),
    activeDekId: 'dek-1',
    revision: 1,
    clearEncryptionSession: mockClearEncryptionSession,
    refreshKeyRingProfile: mockRefreshKeyRingProfile,
    updateKeyRingProfile: vi.fn(),
  }),
}));

vi.mock('../../e2ee/key-ring-api', () => {
  class KeyRingConflictError extends Error {
    constructor() {
      super('Key ring conflict');
      this.name = 'KeyRingConflictError';
    }
  }
  return {
    KeyRingConflictError,
    fetchKeyRingProfile: () => mockFetchKeyRingProfile(),
    changeMasterPassword: () => mockChangeMasterPassword(),
  };
});

vi.mock('../../e2ee/encryption-crypto', () => ({
  createPasswordWrapperPayload: () => mockCreatePasswordWrapperPayload(),
  generateLdk: vi.fn(),
  unwrapKeyRingProfile: () => mockUnwrapKeyRingProfile(),
  unwrapMekWithPin: () => mockUnwrapMekWithPin(),
  wrapMekWithLdk: vi.fn(),
  wrapMekWithPin: vi.fn(),
}));

vi.mock('../../e2ee/keys-indexeddb', () => ({
  KeysIndexeddb: class {
    whenReady = Promise.resolve();

    close() {}

    readLocalWrapper() {
      return Promise.resolve(localWrapper);
    }

    updatePinFailedAttempts() {
      return mockUpdatePinFailedAttempts();
    }

    deleteLocalWrapper() {
      localWrapper = null;
      return mockDeleteLocalWrapper();
    }

    writeLocalWrapper() {
      return Promise.resolve();
    }
  },
}));

function profile(): Profile {
  return {
    keyRing: {
      id: 'key-ring-1',
      userId: 'test-user',
      activeDekId: 'dek-1',
      revision: 1,
      encryptionVersion: 1,
      encryptionAlgorithm: 'aes-256-gcm',
      iv: 'iv',
      ciphertext: 'ciphertext',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    wrappers: [
      {
        id: 'current-wrapper',
        userId: 'test-user',
        method: 'password',
        kdfVersion: 1,
        kdfAlgorithm: 'argon2id',
        kdfParams: {
          memorySize: 65536,
          iterations: 3,
          parallelism: 1,
          hashLength: 32,
        },
        kdfSalt: 'salt',
        wrappingVersion: 1,
        wrappingAlgorithm: 'aes-256-gcm',
        wrappingParams: { ivBytes: 12, tagBits: 128 },
        wrappingIv: 'iv',
        ciphertext: 'ciphertext',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  };
}

beforeEach(() => {
  localWrapper = { method: 'ldk' };
  mockClearEncryptionSession.mockClear();
  mockRefreshKeyRingProfile.mockReset();
  mockRefreshKeyRingProfile.mockResolvedValue(undefined);
  mockFetchKeyRingProfile.mockReset();
  mockFetchKeyRingProfile.mockResolvedValue(profile());
  mockChangeMasterPassword.mockReset();
  mockChangeMasterPassword.mockResolvedValue(undefined);
  mockCreatePasswordWrapperPayload.mockReset();
  mockCreatePasswordWrapperPayload.mockResolvedValue({
    wrappingId: 'new-wrapper',
  });
  mockUnwrapKeyRingProfile.mockReset();
  mockUnwrapKeyRingProfile.mockResolvedValue({});
  mockUnwrapMekWithPin.mockReset();
  mockUnwrapMekWithPin.mockResolvedValue(new Uint8Array(32));
  mockUpdatePinFailedAttempts.mockReset();
  mockUpdatePinFailedAttempts.mockResolvedValue(undefined);
  mockDeleteLocalWrapper.mockReset();
  mockDeleteLocalWrapper.mockResolvedValue(undefined);
});

describe('SecuritySettingsPage master password change', () => {
  it('changes password after current password verification', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<SecuritySettingsPage />);

    await user.click(screen.getByRole('button', { name: 'Promeni šifru' }));
    await user.type(
      await screen.findByLabelText('Trenutna šifra'),
      'old-password',
    );
    await user.click(screen.getByRole('button', { name: 'Potvrdi' }));
    await user.type(await screen.findByLabelText('Nova šifra'), 'new-password');
    await user.type(
      screen.getByLabelText('Potvrdite novu šifru'),
      'new-password',
    );
    await user.click(screen.getByRole('button', { name: 'Promeni šifru' }));

    await waitFor(() =>
      expect(mockChangeMasterPassword).toHaveBeenCalledTimes(1),
    );
    expect(mockRefreshKeyRingProfile).toHaveBeenCalledTimes(1);
  });

  it('shows PIN verification when PIN local wrapper is active', async () => {
    localWrapper = { method: 'pin', failedAttempts: 0 };
    const user = userEvent.setup();
    await renderWithProviders(<SecuritySettingsPage />);

    await user.click(screen.getByRole('button', { name: 'Promeni šifru' }));

    expect(await screen.findByText('Unesite PIN kod')).toBeInTheDocument();
    expect(screen.queryByLabelText('Trenutna šifra')).not.toBeInTheDocument();
  });

  it('shows current-password verification errors without submitting', async () => {
    mockUnwrapKeyRingProfile.mockRejectedValue(new Error('wrong password'));
    const user = userEvent.setup();
    await renderWithProviders(<SecuritySettingsPage />);

    await user.click(screen.getByRole('button', { name: 'Promeni šifru' }));
    await user.type(await screen.findByLabelText('Trenutna šifra'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Potvrdi' }));

    expect(
      await screen.findByText('Pogrešna šifra. Pokušajte ponovo.'),
    ).toBeInTheDocument();
    expect(mockChangeMasterPassword).not.toHaveBeenCalled();
  });

  it('clears encryption session on stale-wrapper conflict', async () => {
    const { KeyRingConflictError } = await import('../../e2ee/key-ring-api');
    mockChangeMasterPassword.mockRejectedValue(new KeyRingConflictError());
    const user = userEvent.setup();
    await renderWithProviders(<SecuritySettingsPage />);

    await user.click(screen.getByRole('button', { name: 'Promeni šifru' }));
    await user.type(
      await screen.findByLabelText('Trenutna šifra'),
      'old-password',
    );
    await user.click(screen.getByRole('button', { name: 'Potvrdi' }));
    await user.type(await screen.findByLabelText('Nova šifra'), 'new-password');
    await user.type(
      screen.getByLabelText('Potvrdite novu šifru'),
      'new-password',
    );
    await user.click(screen.getByRole('button', { name: 'Promeni šifru' }));

    await waitFor(() =>
      expect(mockClearEncryptionSession).toHaveBeenCalledTimes(1),
    );
  });

  it('rejects invalid new password before submitting', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<SecuritySettingsPage />);

    await user.click(screen.getByRole('button', { name: 'Promeni šifru' }));
    await user.type(
      await screen.findByLabelText('Trenutna šifra'),
      'old-password',
    );
    await user.click(screen.getByRole('button', { name: 'Potvrdi' }));
    await user.type(await screen.findByLabelText('Nova šifra'), 'short');
    await user.type(screen.getByLabelText('Potvrdite novu šifru'), 'short');
    await user.click(
      within(
        screen.getByRole('dialog', {
          name: 'Promenite šifru za šifrovanje',
        }),
      ).getByRole('button', { name: 'Promeni šifru' }),
    );

    expect(
      await screen.findByText('Šifra mora imati najmanje 8 znakova.'),
    ).toBeInTheDocument();
    expect(mockChangeMasterPassword).not.toHaveBeenCalled();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nWrapper } from '../../../tests/app/render-helpers';
import { AuthContext } from '../../auth/auth-context';
import { EncryptionGate } from '../encryption-gate';
import type {
  CreateEncryptionKeyRequest,
  SerializedEncryptionKeyRecord,
} from '../encryption-key-record';

const createEncryptionKeyRecordMock = vi.hoisted(() => vi.fn());
const fetchEncryptionKeyRecordMock = vi.hoisted(() => vi.fn());
const createWrappedMasterKeyMock = vi.hoisted(() => vi.fn());
const unwrapMasterKeyMock = vi.hoisted(() => vi.fn());

vi.mock('../encryption-key-api', () => {
  class EncryptionKeyNotFoundError extends Error {}
  return {
    EncryptionKeyNotFoundError,
    createEncryptionKeyRecord: createEncryptionKeyRecordMock,
    fetchEncryptionKeyRecord: fetchEncryptionKeyRecordMock,
  };
});

vi.mock('../encryption-crypto', () => ({
  createWrappedMasterKey: createWrappedMasterKeyMock,
  unwrapMasterKey: unwrapMasterKeyMock,
}));

const masterKey = new Uint8Array(32).fill(1);

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

function notFoundError(): Error {
  const error = new Error('not found');
  error.name = 'EncryptionKeyNotFoundError';
  return error;
}

function renderGate(userId = 'user-1') {
  localStorage.setItem('autokpo:locale', 'sr-Latn');
  render(
    <I18nWrapper>
      <AuthContext
        value={{
          user: { id: userId, email: 'user@example.com', image: null },
          refresh: () => Promise.resolve(userId),
          logout: () => Promise.resolve(),
        }}
      >
        <EncryptionGate userId={userId}>
          <div>protected content</div>
        </EncryptionGate>
      </AuthContext>
    </I18nWrapper>,
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  createEncryptionKeyRecordMock.mockReset();
  fetchEncryptionKeyRecordMock.mockReset();
  createWrappedMasterKeyMock.mockReset();
  unwrapMasterKeyMock.mockReset();
  fetchEncryptionKeyRecordMock.mockRejectedValue(notFoundError());
  createWrappedMasterKeyMock.mockResolvedValue({
    request: { keyId: 'key-1' } as CreateEncryptionKeyRequest,
    masterKey,
  });
  createEncryptionKeyRecordMock.mockResolvedValue(makeRecord());
  unwrapMasterKeyMock.mockResolvedValue(masterKey);
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('EncryptionGate', () => {
  it('shows setup shell when no profile exists', async () => {
    renderGate();

    expect(
      await screen.findByRole('heading', {
        name: /Podesite šifru za šifrovanje/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('requires setup acknowledgement', async () => {
    const user = userEvent.setup();
    renderGate();

    await user.type(
      await screen.findByLabelText(/Šifra za šifrovanje/i),
      'secret123',
    );
    await user.type(screen.getByLabelText(/Potvrdite šifru/i), 'secret123');
    await user.click(
      screen.getByRole('button', { name: /Nastavi ka aplikaciji/i }),
    );

    expect(createWrappedMasterKeyMock).not.toHaveBeenCalled();
  });

  it('rejects short setup password', async () => {
    const user = userEvent.setup();
    renderGate();

    await user.type(
      await screen.findByLabelText(/Šifra za šifrovanje/i),
      'secret',
    );
    await user.type(screen.getByLabelText(/Potvrdite šifru/i), 'secret');
    await user.click(
      screen.getByRole('checkbox', {
        name: /Razumem da AutoKPO ne može da vrati ovu šifru/i,
      }),
    );
    await user.click(
      screen.getByRole('button', { name: /Nastavi ka aplikaciji/i }),
    );

    expect(
      screen.getAllByText(/Šifra mora imati najmanje 8 znakova/i),
    ).toHaveLength(1);
    expect(createWrappedMasterKeyMock).not.toHaveBeenCalled();
  });

  it('rejects mismatched setup confirmation', async () => {
    const user = userEvent.setup();
    renderGate();

    await user.type(
      await screen.findByLabelText(/Šifra za šifrovanje/i),
      'secret123',
    );
    await user.type(screen.getByLabelText(/Potvrdite šifru/i), 'mismatch');
    await user.click(
      screen.getByRole('checkbox', {
        name: /Razumem da AutoKPO ne može da vrati ovu šifru/i,
      }),
    );
    await user.click(
      screen.getByRole('button', { name: /Nastavi ka aplikaciji/i }),
    );

    expect(createWrappedMasterKeyMock).not.toHaveBeenCalled();
  });

  it('creates wrapped key, unlocks in memory, and renders children', async () => {
    const user = userEvent.setup();
    renderGate();

    await user.type(
      await screen.findByLabelText(/Šifra za šifrovanje/i),
      'secret123',
    );
    await user.type(screen.getByLabelText(/Potvrdite šifru/i), 'secret123');
    await user.click(
      screen.getByLabelText(/Razumem da AutoKPO ne može da vrati ovu šifru/i),
    );
    await user.click(
      screen.getByRole('button', { name: /Nastavi ka aplikaciji/i }),
    );

    expect(await screen.findByText('protected content')).toBeInTheDocument();
    expect(createWrappedMasterKeyMock).toHaveBeenCalledWith(
      'user-1',
      'secret123',
    );
    expect(createEncryptionKeyRecordMock).toHaveBeenCalledWith({
      keyId: 'key-1',
    });
    expect(localStorage.getItem('autokpo:e2ee:wrapped-key:user-1')).toBe(
      JSON.stringify(makeRecord()),
    );
  });

  it('shows unlock screen for an existing profile', () => {
    cacheRecord();

    renderGate();

    expect(
      screen.getByRole('heading', { name: /Otključajte podatke/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('keeps locked state and shows inline error on wrong password', async () => {
    const user = userEvent.setup();
    cacheRecord();
    unwrapMasterKeyMock.mockRejectedValue(new Error('wrong password'));

    renderGate();

    await user.type(screen.getByLabelText(/Šifra za šifrovanje/i), 'wrongpass');
    await user.click(
      screen.getByRole('button', { name: /Otključaj podatke/i }),
    );

    expect(screen.getByText(/Šifra nije tačna/i)).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders children after correct unlock password', async () => {
    const user = userEvent.setup();
    cacheRecord();

    renderGate();

    await user.type(screen.getByLabelText(/Šifra za šifrovanje/i), 'secret123');
    await user.click(
      screen.getByRole('button', { name: /Otključaj podatke/i }),
    );

    expect(await screen.findByText('protected content')).toBeInTheDocument();
    expect(unwrapMasterKeyMock).toHaveBeenCalledWith('secret123', makeRecord());
  });

  it('resets gate state when user changes', async () => {
    const user = userEvent.setup();
    cacheRecord();

    localStorage.setItem('autokpo:locale', 'sr-Latn');
    const { rerender } = render(
      <I18nWrapper>
        <AuthContext
          value={{
            user: { id: 'user-1', email: 'user@example.com', image: null },
            refresh: () => Promise.resolve('user-1'),
            logout: () => Promise.resolve(),
          }}
        >
          <EncryptionGate userId="user-1">
            <div>protected content</div>
          </EncryptionGate>
        </AuthContext>
      </I18nWrapper>,
    );

    await user.type(screen.getByLabelText(/Šifra za šifrovanje/i), 'secret123');
    await user.click(
      screen.getByRole('button', { name: /Otključaj podatke/i }),
    );

    expect(await screen.findByText('protected content')).toBeInTheDocument();

    rerender(
      <I18nWrapper>
        <AuthContext
          value={{
            user: { id: 'user-2', email: 'user@example.com', image: null },
            refresh: () => Promise.resolve('user-2'),
            logout: () => Promise.resolve(),
          }}
        >
          <EncryptionGate userId="user-2">
            <div>protected content</div>
          </EncryptionGate>
        </AuthContext>
      </I18nWrapper>,
    );

    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        name: /Podesite šifru za šifrovanje/i,
      }),
    ).toBeInTheDocument();
  });

  it('shows non-recovery explanation without destructive reset action', async () => {
    const user = userEvent.setup();
    cacheRecord();

    renderGate();

    await user.click(
      screen.getByRole('link', { name: /Zaboravili ste šifru/i }),
    );

    expect(
      screen.getByText(/AutoKPO ne može da vrati ovu šifru/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /reset/i }),
    ).not.toBeInTheDocument();
  });
});

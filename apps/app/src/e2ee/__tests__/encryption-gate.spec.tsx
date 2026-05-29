import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nWrapper } from '../../../tests/app/render-helpers';
import { AuthContext } from '../../auth/auth-context';
import { useEncryptionContext } from '../encryption-context';
import { EncryptionGate } from '../encryption-gate';
import { KDF_PARAMS_V1 } from '../key-ring-record';
import type {
  CreateKeyRingProfileRequest,
  SerializedKeyRingProfile,
} from '../key-ring-record';
import { KeysIndexeddb } from '../keys-indexeddb';

const createKeyRingProfileMock = vi.hoisted(() => vi.fn());
const fetchKeyRingProfileMock = vi.hoisted(() => vi.fn());
const updateKeyRingProfileMock = vi.hoisted(() => vi.fn());
const createKeyRingProfilePayloadMock = vi.hoisted(() => vi.fn());
const unwrapKeyRingProfileMock = vi.hoisted(() => vi.fn());
const generateLdkMock = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const wrapMekWithLdkMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    ciphertext: new Uint8Array(48),
    iv: new Uint8Array(12),
  }),
);
const unwrapMekWithLdkMock = vi.hoisted(() => vi.fn());
const unwrapMekWithPinMock = vi.hoisted(() => vi.fn());
const decryptKeyRingWithMekMock = vi.hoisted(() => vi.fn());

vi.mock('../key-ring-api', () => {
  class KeyRingNotFoundError extends Error {
    constructor() {
      super('not found');
      this.name = 'KeyRingNotFoundError';
    }
  }
  class KeyRingConflictError extends Error {
    constructor() {
      super('conflict');
      this.name = 'KeyRingConflictError';
    }
  }
  return {
    KeyRingConflictError,
    KeyRingNotFoundError,
    createKeyRingProfile: createKeyRingProfileMock,
    fetchKeyRingProfile: fetchKeyRingProfileMock,
    updateKeyRingProfile: updateKeyRingProfileMock,
  };
});

vi.mock('../encryption-crypto', () => ({
  createKeyRingProfilePayload: createKeyRingProfilePayloadMock,
  unwrapKeyRingProfile: unwrapKeyRingProfileMock,
  generateLdk: generateLdkMock,
  wrapMekWithLdk: wrapMekWithLdkMock,
  unwrapMekWithLdk: unwrapMekWithLdkMock,
  unwrapMekWithPin: unwrapMekWithPinMock,
  decryptKeyRingWithMek: decryptKeyRingWithMekMock,
  EncryptionUnlockError: class EncryptionUnlockError extends Error {
    constructor() {
      super('Failed to unlock key ring');
      this.name = 'EncryptionUnlockError';
    }
  },
  wrappedMekAad: (userId: string, wrapperId: string, method: string) =>
    new TextEncoder().encode(
      `autokpo:e2ee-wrapped-mek:v1:${userId}:${wrapperId}:${method}`,
    ),
  pinSaltAad: (userId: string, wrapperId: string) =>
    new TextEncoder().encode(`autokpo:e2ee-pin-salt:v1:${userId}:${wrapperId}`),
}));

const activeDek = new Uint8Array(32).fill(1);

function makeRecord(userId = 'user-1'): SerializedKeyRingProfile {
  return {
    keyRing: {
      id: 'key-ring-1',
      userId,
      activeDekId: 'dek-1',
      revision: 1,
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

function notFoundError(): Error {
  const error = new Error('not found');
  error.name = 'KeyRingNotFoundError';
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
  createKeyRingProfileMock.mockReset();
  fetchKeyRingProfileMock.mockReset();
  updateKeyRingProfileMock.mockReset();
  createKeyRingProfilePayloadMock.mockReset();
  unwrapKeyRingProfileMock.mockReset();
  generateLdkMock.mockResolvedValue({});
  wrapMekWithLdkMock.mockResolvedValue({
    ciphertext: new Uint8Array(48),
    iv: new Uint8Array(12),
  });
  unwrapMekWithLdkMock.mockReset();
  unwrapMekWithPinMock.mockReset();
  decryptKeyRingWithMekMock.mockResolvedValue({
    activeDek,
    activeDekId: 'dek-1',
    revision: 1,
    deks: { 'dek-1': activeDek },
  });
  fetchKeyRingProfileMock.mockRejectedValue(notFoundError());
  createKeyRingProfilePayloadMock.mockResolvedValue({
    request: { keyRingId: 'key-ring-1' } as CreateKeyRingProfileRequest,
    mek: new Uint8Array(32),
    activeDek,
    activeDekId: 'dek-1',
    revision: 1,
    deks: { 'dek-1': activeDek },
  });
  createKeyRingProfileMock.mockResolvedValue(makeRecord());
  unwrapKeyRingProfileMock.mockResolvedValue({
    mek: new Uint8Array(32),
    activeDek,
    activeDekId: 'dek-1',
    revision: 1,
    deks: { 'dek-1': activeDek },
  });
  decryptKeyRingWithMekMock.mockResolvedValue({
    activeDek,
    activeDekId: 'dek-1',
    revision: 1,
    deks: { 'dek-1': activeDek },
  });
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

    expect(createKeyRingProfilePayloadMock).not.toHaveBeenCalled();
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
    expect(createKeyRingProfilePayloadMock).not.toHaveBeenCalled();
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

    expect(createKeyRingProfilePayloadMock).not.toHaveBeenCalled();
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
    expect(createKeyRingProfilePayloadMock).toHaveBeenCalledWith(
      'user-1',
      'secret123',
    );
    expect(createKeyRingProfileMock).toHaveBeenCalledWith({
      keyRingId: 'key-ring-1',
    });
  });

  it('shows unlock screen for an existing profile after backend check', async () => {
    fetchKeyRingProfileMock.mockResolvedValue(makeRecord());

    renderGate();

    expect(
      await screen.findByRole('heading', { name: /Otključajte podatke/i }),
    ).toBeInTheDocument();
    expect(fetchKeyRingProfileMock).toHaveBeenCalled();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('does not use cache to skip a successful backend-first profile check', async () => {
    fetchKeyRingProfileMock.mockRejectedValue(notFoundError());

    renderGate();

    expect(
      await screen.findByRole('heading', {
        name: /Podesite šifru za šifrovanje/i,
      }),
    ).toBeInTheDocument();
    expect(fetchKeyRingProfileMock).toHaveBeenCalled();
    expect(
      screen.queryByRole('heading', { name: /Otključajte podatke/i }),
    ).not.toBeInTheDocument();
  });

  it('keeps locked state and shows inline error on wrong password', async () => {
    const user = userEvent.setup();
    fetchKeyRingProfileMock.mockResolvedValue(makeRecord());
    unwrapKeyRingProfileMock.mockRejectedValue(new Error('wrong password'));

    renderGate();

    await user.type(
      await screen.findByLabelText(/Šifra za šifrovanje/i),
      'wrongpass',
    );
    await user.click(
      screen.getByRole('button', { name: /Otključaj podatke/i }),
    );

    expect(await screen.findByText(/Šifra nije tačna/i)).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders children after correct unlock password', async () => {
    const user = userEvent.setup();
    fetchKeyRingProfileMock.mockResolvedValue(makeRecord());

    renderGate();

    await user.type(
      await screen.findByLabelText(/Šifra za šifrovanje/i),
      'secret123',
    );
    await user.click(
      screen.getByRole('button', { name: /Otključaj podatke/i }),
    );

    expect(await screen.findByText('protected content')).toBeInTheDocument();
    expect(unwrapKeyRingProfileMock).toHaveBeenCalledWith(
      'secret123',
      makeRecord(),
    );
  });

  it('resets gate state when user changes', async () => {
    const user = userEvent.setup();
    fetchKeyRingProfileMock.mockResolvedValue(makeRecord());

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

    await user.type(
      await screen.findByLabelText(/Šifra za šifrovanje/i),
      'secret123',
    );
    await user.click(
      screen.getByRole('button', { name: /Otključaj podatke/i }),
    );

    expect(await screen.findByText('protected content')).toBeInTheDocument();

    fetchKeyRingProfileMock.mockRejectedValue(notFoundError());

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
    fetchKeyRingProfileMock.mockResolvedValue(makeRecord());

    renderGate();

    await user.click(
      await screen.findByRole('link', { name: /Zaboravili ste šifru/i }),
    );

    expect(
      screen.getByText(/AutoKPO ne može da vrati ovu šifru/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /reset/i }),
    ).not.toBeInTheDocument();
  });

  it('provides EncryptionContext with activeDek and activeDekId after unlock', async () => {
    const user = userEvent.setup();
    fetchKeyRingProfileMock.mockResolvedValue(makeRecord());

    let capturedContext: ReturnType<typeof useEncryptionContext> | null = null;

    function ContextCapture() {
      capturedContext = useEncryptionContext();
      return null;
    }

    localStorage.setItem('autokpo:locale', 'sr-Latn');
    render(
      <I18nWrapper>
        <AuthContext
          value={{
            user: { id: 'user-1', email: 'user@example.com', image: null },
            refresh: () => Promise.resolve('user-1'),
            logout: () => Promise.resolve(),
          }}
        >
          <EncryptionGate userId="user-1">
            <ContextCapture />
            <div>protected content</div>
          </EncryptionGate>
        </AuthContext>
      </I18nWrapper>,
    );

    await user.type(
      await screen.findByLabelText(/Šifra za šifrovanje/i),
      'secret123',
    );
    await user.click(
      screen.getByRole('button', { name: /Otključaj podatke/i }),
    );

    await screen.findByText('protected content');

    expect(capturedContext).not.toBeNull();
    expect(capturedContext!.activeDek).toEqual(activeDek);
    expect(capturedContext!.activeDekId).toBe('dek-1');
  });

  it('updates encrypted key ring cache from successful context update', async () => {
    const user = userEvent.setup();
    fetchKeyRingProfileMock.mockResolvedValue(makeRecord());
    const updated = makeRecord();
    updated.keyRing.revision = 2;
    updated.keyRing.ciphertext = 'updated-ciphertext';
    updateKeyRingProfileMock.mockResolvedValue(updated);
    let capturedContext: ReturnType<typeof useEncryptionContext> | null = null;

    function ContextCapture() {
      capturedContext = useEncryptionContext();
      return null;
    }

    localStorage.setItem('autokpo:locale', 'sr-Latn');
    render(
      <I18nWrapper>
        <AuthContext
          value={{
            user: { id: 'user-1', email: 'user@example.com', image: null },
            refresh: () => Promise.resolve('user-1'),
            logout: () => Promise.resolve(),
          }}
        >
          <EncryptionGate userId="user-1">
            <ContextCapture />
            <div>protected content</div>
          </EncryptionGate>
        </AuthContext>
      </I18nWrapper>,
    );
    await user.type(
      await screen.findByLabelText(/Šifra za šifrovanje/i),
      'secret123',
    );
    await user.click(
      screen.getByRole('button', { name: /Otključaj podatke/i }),
    );
    await screen.findByText('protected content');

    await capturedContext!.updateKeyRingProfile({
      currentRevision: 1,
      activeDekId: 'dek-1',
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionParams: { iv: 'iv', tagBits: 128 },
      ciphertext: 'updated-ciphertext',
    });

    const store = new KeysIndexeddb();
    const cached = await store.readKeyRing('user-1');
    store.close();
    expect(cached?.revision).toBe(2);
    expect(cached?.ciphertext).toBe('updated-ciphertext');
  });

  it('refetches encrypted key ring cache on context update conflict', async () => {
    const user = userEvent.setup();
    fetchKeyRingProfileMock.mockResolvedValueOnce(makeRecord());
    fetchKeyRingProfileMock.mockResolvedValueOnce(makeRecord());
    const latest = makeRecord();
    latest.keyRing.revision = 3;
    latest.keyRing.ciphertext = 'latest-ciphertext';
    fetchKeyRingProfileMock.mockResolvedValueOnce(latest);
    const conflict = new Error('conflict');
    conflict.name = 'KeyRingConflictError';
    updateKeyRingProfileMock.mockRejectedValue(conflict);
    let capturedContext: ReturnType<typeof useEncryptionContext> | null = null;

    function ContextCapture() {
      capturedContext = useEncryptionContext();
      return null;
    }

    localStorage.setItem('autokpo:locale', 'sr-Latn');
    render(
      <I18nWrapper>
        <AuthContext
          value={{
            user: { id: 'user-1', email: 'user@example.com', image: null },
            refresh: () => Promise.resolve('user-1'),
            logout: () => Promise.resolve(),
          }}
        >
          <EncryptionGate userId="user-1">
            <ContextCapture />
            <div>protected content</div>
          </EncryptionGate>
        </AuthContext>
      </I18nWrapper>,
    );
    await user.type(
      await screen.findByLabelText(/Šifra za šifrovanje/i),
      'secret123',
    );
    await user.click(
      screen.getByRole('button', { name: /Otključaj podatke/i }),
    );
    await screen.findByText('protected content');

    await expect(
      capturedContext!.updateKeyRingProfile({
        currentRevision: 1,
        activeDekId: 'dek-1',
        encryptionAlgorithm: 'aes-256-gcm',
        encryptionParams: { iv: 'iv', tagBits: 128 },
        ciphertext: 'stale-ciphertext',
      }),
    ).rejects.toThrow('conflict');

    const store = new KeysIndexeddb();
    const cached = await store.readKeyRing('user-1');
    store.close();
    expect(cached?.revision).toBe(3);
    expect(cached?.ciphertext).toBe('latest-ciphertext');
  });

  it('does not render children (and thus context) when locked', async () => {
    fetchKeyRingProfileMock.mockResolvedValue(makeRecord());

    renderGate();

    expect(
      await screen.findByRole('heading', { name: /Otključajte podatke/i }),
    ).toBeInTheDocument();

    // Children are not rendered when locked
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });
});

describe('EncryptionGate — PIN unlock path', () => {
  async function writePinRecord(userId = 'user-1', failedAttempts = 0) {
    const pinLdk = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    const store = new KeysIndexeddb();
    await store.whenReady;
    await store.writeLocalWrapper({
      userId,
      method: 'pin',
      wrapperId: 'wr-pin-1',
      pinLdk,
      pinSaltCiphertext: new Uint8Array(32).fill(1),
      pinSaltAlgorithm: 'aes-256-gcm',
      pinSaltParams: { iv: new Uint8Array(12).fill(2), tagBits: 128 },
      kdfAlgorithm: 'argon2id',
      kdfParams: KDF_PARAMS_V1,
      wrappingAlgorithm: 'aes-256-gcm',
      wrappingParams: { iv: new Uint8Array(12).fill(4), tagBits: 128 },
      ciphertext: new Uint8Array(48).fill(3),
      createdAt: '2026-01-01T00:00:00.000Z',
      failedAttempts,
    });
    store.close();
  }

  it('shows PIN screen when a PIN local wrapper is present', async () => {
    fetchKeyRingProfileMock.mockResolvedValue(makeRecord());
    await writePinRecord();

    renderGate();

    expect(await screen.findByText(/Unesite PIN kod/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Otključajte podatke/i }),
    ).not.toBeInTheDocument();
  });

  it('unlocks with correct PIN and renders children', async () => {
    const user = userEvent.setup();
    fetchKeyRingProfileMock.mockResolvedValue(makeRecord());
    await writePinRecord();

    const mek = new Uint8Array(32).fill(9);
    unwrapMekWithPinMock.mockResolvedValue(mek);
    decryptKeyRingWithMekMock.mockResolvedValue({
      activeDek,
      activeDekId: 'dek-1',
      revision: 1,
      deks: { 'dek-1': activeDek },
    });

    renderGate();

    await screen.findByText(/Unesite PIN kod/i);

    for (const digit of ['1', '2', '3', '4', '5', '6']) {
      await user.keyboard(digit);
    }

    await screen.findByText('protected content');
  });

  it('shows error and increments counter on wrong PIN', async () => {
    const user = userEvent.setup();
    fetchKeyRingProfileMock.mockResolvedValue(makeRecord());
    await writePinRecord();

    unwrapMekWithPinMock.mockRejectedValue(
      Object.assign(new Error('Failed to unlock key ring'), {
        name: 'EncryptionUnlockError',
      }),
    );

    renderGate();

    await screen.findByText(/Unesite PIN kod/i);

    for (const digit of ['0', '0', '0', '0', '0', '0']) {
      await user.keyboard(digit);
    }

    expect(await screen.findByText(/Pogrešan PIN/i)).toBeInTheDocument();
  });

  it('falls back to password screen after 10 failed attempts', async () => {
    const user = userEvent.setup();
    fetchKeyRingProfileMock.mockResolvedValue(makeRecord());
    await writePinRecord('user-1', 9);

    unwrapMekWithPinMock.mockRejectedValue(
      Object.assign(new Error('Failed to unlock key ring'), {
        name: 'EncryptionUnlockError',
      }),
    );

    renderGate();

    await screen.findByText(/Unesite PIN kod/i);

    for (const digit of ['0', '0', '0', '0', '0', '0']) {
      await user.keyboard(digit);
    }

    expect(await screen.findByText(/PIN kod je uklonjen/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Otključajte podatke/i }),
    ).toBeInTheDocument();
  });
});

describe('useEncryptionContext', () => {
  it('throws when called outside EncryptionContext provider', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    function Thief() {
      useEncryptionContext();
      return null;
    }

    expect(() => render(<Thief />)).toThrow(
      'useEncryptionContext called outside EncryptionContext provider',
    );

    consoleError.mockRestore();
  });
});

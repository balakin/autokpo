import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nWrapper } from '../../../tests/app/render-helpers';
import { AuthContext } from '../../auth/auth-context';
import { LOCAL_ENCRYPTION_UNLOCK_KEY } from '../cleanup';
import { EncryptionGate } from '../encryption-gate';
import * as encryptionSession from '../encryption-session';

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
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('EncryptionGate', () => {
  it('shows setup shell when no profile exists', () => {
    renderGate();

    expect(
      screen.getByRole('heading', { name: /Podesite šifru za šifrovanje/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('requires setup acknowledgement', async () => {
    const user = userEvent.setup();
    const createProfileSpy = vi.spyOn(
      encryptionSession,
      'createPlaceholderEncryptionProfile',
    );
    renderGate();

    await user.type(screen.getByLabelText(/Šifra za šifrovanje/i), 'secret123');
    await user.type(screen.getByLabelText(/Potvrdite šifru/i), 'secret123');
    await user.click(
      screen.getByRole('button', { name: /Nastavi ka aplikaciji/i }),
    );

    expect(createProfileSpy).not.toHaveBeenCalled();
  });

  it('rejects short setup password', async () => {
    const user = userEvent.setup();
    const createProfileSpy = vi.spyOn(
      encryptionSession,
      'createPlaceholderEncryptionProfile',
    );
    renderGate();

    await user.type(screen.getByLabelText(/Šifra za šifrovanje/i), 'secret');
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
    expect(createProfileSpy).not.toHaveBeenCalled();
  });

  it('rejects mismatched setup confirmation', async () => {
    const user = userEvent.setup();
    const createProfileSpy = vi.spyOn(
      encryptionSession,
      'createPlaceholderEncryptionProfile',
    );
    renderGate();

    await user.type(screen.getByLabelText(/Šifra za šifrovanje/i), 'secret123');
    await user.type(screen.getByLabelText(/Potvrdite šifru/i), 'mismatch');
    await user.click(
      screen.getByRole('checkbox', {
        name: /Razumem da AutoKPO ne može da vrati ovu šifru/i,
      }),
    );
    await user.click(
      screen.getByRole('button', { name: /Nastavi ka aplikaciji/i }),
    );

    expect(createProfileSpy).not.toHaveBeenCalled();
  });

  it('creates placeholder profile, unlocks session, and renders children', async () => {
    const user = userEvent.setup();
    renderGate();

    await user.type(screen.getByLabelText(/Šifra za šifrovanje/i), 'secret123');
    await user.type(screen.getByLabelText(/Potvrdite šifru/i), 'secret123');
    await user.click(
      screen.getByLabelText(/Razumem da AutoKPO ne može da vrati ovu šifru/i),
    );
    await user.click(
      screen.getByRole('button', { name: /Nastavi ka aplikaciji/i }),
    );

    expect(await screen.findByText('protected content')).toBeInTheDocument();
    expect(localStorage.getItem('autokpo:e2ee:profile:user-1')).toBe(
      JSON.stringify({ version: 1, verifier: 'secret123' }),
    );
    expect(
      JSON.parse(
        sessionStorage.getItem(LOCAL_ENCRYPTION_UNLOCK_KEY) ?? '{}',
      ) as unknown,
    ).toMatchObject({ version: 1, userId: 'user-1' });
  });

  it('shows unlock screen for an existing profile', () => {
    localStorage.setItem(
      'autokpo:e2ee:profile:user-1',
      JSON.stringify({ version: 1, verifier: 'secret123' }),
    );

    renderGate();

    expect(
      screen.getByRole('heading', { name: /Otključajte podatke/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('keeps locked state and shows inline error on wrong password', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'autokpo:e2ee:profile:user-1',
      JSON.stringify({ version: 1, verifier: 'secret123' }),
    );

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
    localStorage.setItem(
      'autokpo:e2ee:profile:user-1',
      JSON.stringify({ version: 1, verifier: 'secret123' }),
    );

    renderGate();

    await user.type(screen.getByLabelText(/Šifra za šifrovanje/i), 'secret123');
    await user.click(
      screen.getByRole('button', { name: /Otključaj podatke/i }),
    );

    expect(await screen.findByText('protected content')).toBeInTheDocument();
  });

  it('resets gate state when user changes', () => {
    localStorage.setItem(
      'autokpo:e2ee:profile:user-1',
      JSON.stringify({ version: 1, verifier: 'secret123' }),
    );
    sessionStorage.setItem(
      LOCAL_ENCRYPTION_UNLOCK_KEY,
      JSON.stringify({
        version: 1,
        userId: 'user-1',
        unlockedAt: '2026-01-01T00:00:00.000Z',
      }),
    );

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

    expect(screen.getByText('protected content')).toBeInTheDocument();

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
      screen.getByRole('heading', { name: /Podesite šifru za šifrovanje/i }),
    ).toBeInTheDocument();
  });

  it('shows non-recovery explanation without destructive reset action', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'autokpo:e2ee:profile:user-1',
      JSON.stringify({ version: 1, verifier: 'secret123' }),
    );

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

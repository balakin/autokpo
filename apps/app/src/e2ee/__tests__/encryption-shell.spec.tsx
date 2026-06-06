import { render, screen } from '@testing-library/react';
import { I18nWrapper } from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EncryptionShell } from '../encryption-shell';

vi.mock('../encryption-profile-popover', () => ({
  EncryptionProfilePopover: () => <button type="button">Profile</button>,
}));

function renderEncryptionShell() {
  render(
    <I18nWrapper>
      <EncryptionShell>
        <div>locked content</div>
      </EncryptionShell>
    </I18nWrapper>,
  );
}

describe('EncryptionShell legal footer', () => {
  beforeEach(() => {
    localStorage.setItem('autokpo:locale', 'sr-Latn');
  });

  it('preserves AGPL source link and renders legal links', () => {
    renderEncryptionShell();

    expect(screen.getByText(/AGPL-3\.0/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Izvorni kod/i })).toHaveAttribute(
      'href',
      'https://github.com/balakin/autokpo',
    );
    expect(screen.getByRole('link', { name: /Uslovi/i })).toHaveAttribute(
      'href',
      'https://autokpo.com/terms/',
    );
    expect(screen.getByRole('link', { name: /Privatnost/i })).toHaveAttribute(
      'href',
      'https://autokpo.com/privacy/',
    );
    expect(screen.getByRole('link', { name: /Kolačići/i })).toHaveAttribute(
      'href',
      'https://autokpo.com/cookies/',
    );
  });

  it('uses active locale for legal footer links', () => {
    localStorage.setItem('autokpo:locale', 'en');
    renderEncryptionShell();

    expect(screen.getByRole('link', { name: /Terms/i })).toHaveAttribute(
      'href',
      'https://autokpo.com/en/terms/',
    );
    expect(screen.getByRole('link', { name: /Privacy/i })).toHaveAttribute(
      'href',
      'https://autokpo.com/en/privacy/',
    );
    expect(screen.getByRole('link', { name: /Cookies/i })).toHaveAttribute(
      'href',
      'https://autokpo.com/en/cookies/',
    );
  });

  it('legal links open externally', () => {
    renderEncryptionShell();

    for (const name of [/Uslovi/i, /Privatnost/i, /Kolačići/i]) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
      expect(link).toHaveAttribute(
        'rel',
        expect.stringContaining('noreferrer'),
      );
    }
  });
});

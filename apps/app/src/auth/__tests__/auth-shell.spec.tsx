import { render, screen } from '@testing-library/react';
import { I18nWrapper } from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthShell } from '../auth-shell';

function renderAuthShell() {
  render(
    <I18nWrapper>
      <AuthShell>
        <div>content</div>
      </AuthShell>
    </I18nWrapper>,
  );
}

describe('AuthShell AGPL notice', () => {
  beforeEach(() => {
    localStorage.setItem('autokpo:locale', 'sr-Latn');
  });

  it('displays the AGPL-3.0 license identifier', () => {
    renderAuthShell();
    expect(screen.getByText(/AGPL-3\.0/)).toBeInTheDocument();
  });

  it('renders a source code link with the translated label', () => {
    renderAuthShell();
    expect(
      screen.getByRole('link', { name: /Izvorni kod/i }),
    ).toBeInTheDocument();
  });

  it('source link points to the GitHub repo', () => {
    renderAuthShell();
    const link = screen.getByRole('link', { name: /Izvorni kod/i });
    expect(link).toHaveAttribute('href', 'https://github.com/balakin/autokpo');
  });

  it('source link opens in a new tab', () => {
    renderAuthShell();
    const link = screen.getByRole('link', { name: /Izvorni kod/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('renders the preferences gear button', () => {
    renderAuthShell();
    expect(
      screen.getByRole('button', { name: /Podešavanja/i }),
    ).toBeInTheDocument();
  });

  it('renders localized legal footer links', () => {
    renderAuthShell();

    expect(
      screen.getByRole('link', { name: /Uslovi korišćenja/i }),
    ).toHaveAttribute('href', 'https://autokpo.com/sr-latn/terms/');
    expect(
      screen.getByRole('link', { name: /Politika privatnosti/i }),
    ).toHaveAttribute('href', 'https://autokpo.com/sr-latn/privacy/');
  });

  it('uses active locale for legal footer links', () => {
    localStorage.setItem('autokpo:locale', 'ru');
    renderAuthShell();

    expect(
      screen.getByRole('link', { name: /Условия использования/i }),
    ).toHaveAttribute('href', 'https://autokpo.com/ru/terms/');
    expect(
      screen.getByRole('link', { name: /Политика конфиденциальности/i }),
    ).toHaveAttribute('href', 'https://autokpo.com/ru/privacy/');
  });

  it('legal footer links open externally', () => {
    renderAuthShell();

    for (const name of [/Uslovi korišćenja/i, /Politika privatnosti/i]) {
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

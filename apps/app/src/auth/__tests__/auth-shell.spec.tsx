import { render, screen } from '@testing-library/react';
import { I18nWrapper } from 'tests/render-helpers';
import { describe, expect, it } from 'vitest';

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
});

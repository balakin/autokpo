import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { I18nWrapper } from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { HelpPage } from '../help-page';

function renderHelpPage() {
  const router = createMemoryRouter(
    [{ path: '/help', element: <HelpPage /> }],
    {
      initialEntries: ['/help'],
    },
  );
  return render(
    <I18nWrapper>
      <RouterProvider router={router} />
    </I18nWrapper>,
  );
}

beforeEach(() => {
  localStorage.setItem('autokpo:locale', 'sr-Latn');
});

describe('HelpPage', () => {
  it('renders all seven section headings', () => {
    renderHelpPage();
    expect(screen.getByText('O projektu')).toBeInTheDocument();
    expect(screen.getByText('Kako prijaviti problem')).toBeInTheDocument();
    expect(screen.getByText('Zakonski propisi')).toBeInTheDocument();
    expect(screen.getByText('Doprinesite projektu')).toBeInTheDocument();
    expect(screen.getByText('Autori')).toBeInTheDocument();
    expect(screen.getByText('Licenca')).toBeInTheDocument();
    expect(screen.getByText('Šifrovanje')).toBeInTheDocument();
  });

  it('links to GitHub Issues for bug reports', () => {
    renderHelpPage();
    expect(
      screen.getByRole('link', { name: /Prijavite problem na GitHub-u/i }),
    ).toHaveAttribute('href', 'https://github.com/balakin/autokpo/issues');
  });

  it('links to ZPDGa law', () => {
    renderHelpPage();
    expect(
      screen.getByRole('link', { name: /Zakon o porezu na dohodak građana/i }),
    ).toHaveAttribute(
      'href',
      'https://mfin.gov.rs/sr/propisi-1/zakon-o-porezu-na-dohodak-gradjana-1',
    );
  });

  it('links to ZPDV law', () => {
    renderHelpPage();
    expect(
      screen.getByRole('link', { name: /Zakon o porezu na dodatu vrednost/i }),
    ).toHaveAttribute(
      'href',
      'https://purs.gov.rs/pravna-lica/pdv/zakon/202/zakon-o-porezu-na-dodatu-vrednost.html',
    );
  });

  it('links to author profile', () => {
    renderHelpPage();
    expect(
      screen.getByRole('link', { name: /Dmitrii Balakin/i }),
    ).toHaveAttribute('href', 'https://github.com/dm-balakin');
  });

  it('links to contributors graph', () => {
    renderHelpPage();
    expect(
      screen.getByRole('link', { name: /Svi doprinosioci/i }),
    ).toHaveAttribute(
      'href',
      'https://github.com/balakin/autokpo/graphs/contributors',
    );
  });

  it('links to LICENSE file for AGPL-3.0', () => {
    renderHelpPage();
    expect(screen.getByRole('link', { name: /AGPL-3\.0/i })).toHaveAttribute(
      'href',
      'https://github.com/balakin/autokpo/blob/main/LICENSE',
    );
  });

  it('displays encryption algorithm names and zero-knowledge statement', () => {
    renderHelpPage();
    expect(screen.getByText('Argon2id')).toBeInTheDocument();
    expect(screen.getByText('AES-256-GCM')).toBeInTheDocument();
    expect(
      screen.getByText(/Server nikada ne vidi vaše podatke/i),
    ).toBeInTheDocument();
  });

  it('all external links open in a new tab', () => {
    renderHelpPage();
    const externalLinks = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href')?.startsWith('http'));
    expect(externalLinks.length).toBeGreaterThan(0);
    for (const link of externalLinks) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
      expect(link).toHaveAttribute(
        'rel',
        expect.stringContaining('noreferrer'),
      );
    }
  });
});

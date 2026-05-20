import { Toast } from '@heroui/react';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  getTestDoc,
  I18nWrapper,
  resetTestDoc,
  seedBook,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { DocContext } from '../../crdt/doc-context';
import { AppShell } from '../app-shell';

const TODAY_YEAR = new Date().getFullYear();

function renderAppShell() {
  const doc = getTestDoc();
  const router = createMemoryRouter(
    [
      {
        element: <AppShell />,
        children: [
          { path: 'dashboard', element: <div>Dashboard</div> },
          { path: 'books', element: <div>Books</div> },
          { path: 'settings', element: <div>Settings</div> },
        ],
      },
    ],
    { initialEntries: ['/dashboard'] },
  );
  render(
    <DocContext value={doc}>
      <I18nWrapper>
        <Toast.Provider />
        <RouterProvider router={router} />
      </I18nWrapper>
    </DocContext>,
  );
}

beforeEach(() => resetTestDoc());

describe('Sidebar stats footer', () => {
  it('shows "Ova godina" and "12 meseci" labels', () => {
    renderAppShell();
    const sidebar = screen.getByRole('complementary');
    expect(within(sidebar).getByText('Ova godina')).toBeInTheDocument();
    expect(within(sidebar).getByText('12 meseci')).toBeInTheDocument();
  });

  it('shows zero income when no books exist', () => {
    renderAppShell();
    const sidebar = screen.getByRole('complementary');
    const zeros = within(sidebar).getAllByText('0,00 RSD');
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });

  it('shows correct current-year income', () => {
    seedBook('sidebar-1', {
      year: TODAY_YEAR,
      entries: [
        {
          id: '00000000-0000-4000-8000-000000000099',
          datumPrometa: `${TODAY_YEAR}-06-01`,
          opisPrometa: 'Test',
          odProdajeProizvoda: 2_500_000,
          odIzvrsenihUsluga: 0,
        },
      ],
    });
    renderAppShell();
    const sidebar = screen.getByRole('complementary');
    expect(within(sidebar).getByText('2.500.000,00 RSD')).toBeInTheDocument();
  });

  it('applies success color when income is safe', () => {
    seedBook('sidebar-2', {
      year: TODAY_YEAR,
      entries: [
        {
          id: '00000000-0000-4000-8000-000000000099',
          datumPrometa: `${TODAY_YEAR}-06-01`,
          opisPrometa: 'Test',
          odProdajeProizvoda: 1_000_000,
          odIzvrsenihUsluga: 0,
        },
      ],
    });
    renderAppShell();
    const el = screen.getAllByText('1.000.000,00 RSD')[0];
    expect(el.className).toContain('text-success');
  });

  it('applies danger color when income exceeds annual limit', () => {
    seedBook('sidebar-3', {
      year: TODAY_YEAR,
      entries: [
        {
          id: '00000000-0000-4000-8000-000000000099',
          datumPrometa: `${TODAY_YEAR}-06-01`,
          opisPrometa: 'Test',
          odProdajeProizvoda: 7_000_000,
          odIzvrsenihUsluga: 0,
        },
      ],
    });
    renderAppShell();
    const el = screen.getAllByText('7.000.000,00 RSD')[0];
    expect(el.className).toContain('text-danger');
  });

  it('applies warning color when income is ≥90% of limit', () => {
    seedBook('sidebar-4', {
      year: TODAY_YEAR,
      entries: [
        {
          id: '00000000-0000-4000-8000-000000000099',
          datumPrometa: `${TODAY_YEAR}-06-01`,
          opisPrometa: 'Test',
          odProdajeProizvoda: 5_500_000,
          odIzvrsenihUsluga: 0,
        },
      ],
    });
    renderAppShell();
    const el = screen.getAllByText('5.500.000,00 RSD')[0];
    expect(el.className).toContain('text-warning');
  });
});

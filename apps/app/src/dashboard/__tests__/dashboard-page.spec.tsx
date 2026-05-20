import { screen } from '@testing-library/react';
import {
  renderWithProviders,
  resetTestDoc,
  seedBook,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { DashboardPage } from '../dashboard-page';

const TODAY_YEAR = new Date().getFullYear();

beforeEach(() => {
  resetTestDoc();
});

describe('DashboardPage', () => {
  it('renders sr-only Panel heading', async () => {
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    expect(screen.getByRole('heading', { name: 'Panel' })).toBeInTheDocument();
  });

  it('renders current-year stat card label', async () => {
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    expect(screen.getAllByText('Ova godina').length).toBeGreaterThan(0);
  });

  it('renders last-12M stat card label', async () => {
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    expect(screen.getAllByText('Poslednjih 12 meseci').length).toBeGreaterThan(
      0,
    );
  });

  it('renders all-time total card', async () => {
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    expect(screen.getByText('Ukupno')).toBeInTheDocument();
  });

  it('shows live current-year income', async () => {
    seedBook('dash-1', {
      year: TODAY_YEAR,
      entries: [
        {
          id: '00000000-0000-4000-8000-000000000099',
          datumPrometa: `${TODAY_YEAR}-06-01`,
          opisPrometa: 'Test',
          odProdajeProizvoda: 2_000_000,
          odIzvrsenihUsluga: 0,
        },
      ],
    });
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    const values = screen.getAllByText(/2\.000\.000.*RSD/);
    expect(values.length).toBeGreaterThan(0);
  });

  it('applies success color when income is below 90% of annual limit', async () => {
    seedBook('dash-2', {
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
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    const coloredEl = screen
      .getAllByText(/1\.000\.000.*RSD/)
      .find((el) => el.className.includes('text-success'));
    expect(coloredEl).toBeDefined();
  });

  it('applies danger color when income exceeds annual limit', async () => {
    seedBook('dash-3', {
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
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    const coloredEl = screen
      .getAllByText(/7\.000\.000.*RSD/)
      .find((el) => el.className.includes('text-danger'));
    expect(coloredEl).toBeDefined();
  });

  it('renders progress bars for current-year and last-12M cards', async () => {
    seedBook('dash-4', {
      year: TODAY_YEAR,
      entries: [
        {
          id: '00000000-0000-4000-8000-000000000099',
          datumPrometa: `${TODAY_YEAR}-06-01`,
          opisPrometa: 'Test',
          odProdajeProizvoda: 500_000,
          odIzvrsenihUsluga: 0,
        },
      ],
    });
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThanOrEqual(2);
  });

  it('renders historical peak year card label', async () => {
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    expect(screen.getByText('Rekordna godina')).toBeInTheDocument();
  });

  it('does not render "Poslednja knjiga" card (removed)', async () => {
    seedBook('dash-5', {
      year: TODAY_YEAR,
      entries: [],
    });
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    expect(screen.queryByText('Poslednja knjiga')).not.toBeInTheDocument();
  });

  it('shows favorite books section when at least one book is favorited', async () => {
    seedBook('dash-6a', { year: 2024, favorite: true });
    seedBook('dash-6b', { year: 2023, favorite: false });
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    expect(screen.getByText('Omiljene knjige')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2024' })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '2023' }),
    ).not.toBeInTheDocument();
  });

  it('shows empty state when no books are favorited', async () => {
    seedBook('dash-7', { year: 2024, favorite: false });
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    expect(screen.getByText('Omiljene knjige')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Knjigama' })).toBeInTheDocument();
  });

  it('shows empty state when there are no books', async () => {
    await renderWithProviders(<DashboardPage />, { route: '/dashboard' });
    expect(screen.getByText('Omiljene knjige')).toBeInTheDocument();
  });
});

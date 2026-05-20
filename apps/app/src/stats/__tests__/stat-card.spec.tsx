import { screen } from '@testing-library/react';
import { renderWithProviders } from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { ANNUAL_LIMIT } from '../../constants';
import { StatCard, AllTimeTotalCard } from '../stat-card';

const LABEL = 'Ova godina';

describe('StatCard', () => {
  beforeEach(() => localStorage.clear());

  it('renders the label and formatted value', async () => {
    await renderWithProviders(<StatCard label={LABEL} value={1_000_000} />);
    expect(screen.getByText(LABEL)).toBeInTheDocument();
    expect(screen.getByText(/1\.000\.000.*RSD/)).toBeInTheDocument();
  });

  it('renders a subtitle when provided', async () => {
    await renderWithProviders(
      <StatCard
        label={LABEL}
        value={500_000}
        subtitle="Limit: 6.000.000 RSD"
      />,
    );
    expect(screen.getByText('Limit: 6.000.000 RSD')).toBeInTheDocument();
  });

  it('renders progress bar when limit is provided', async () => {
    await renderWithProviders(
      <StatCard label={LABEL} value={3_000_000} limit={ANNUAL_LIMIT} />,
    );
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('does not render progress bar when no limit', async () => {
    await renderWithProviders(<StatCard label={LABEL} value={3_000_000} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('applies success color class', async () => {
    await renderWithProviders(
      <StatCard label={LABEL} value={1_000_000} color="success" />,
    );
    expect(screen.getByText(/1\.000\.000.*RSD/).className).toContain(
      'text-success',
    );
  });

  it('applies warning color class', async () => {
    await renderWithProviders(
      <StatCard label={LABEL} value={5_500_000} color="warning" />,
    );
    expect(screen.getByText(/5\.500\.000.*RSD/).className).toContain(
      'text-warning',
    );
  });

  it('applies danger color class', async () => {
    await renderWithProviders(
      <StatCard label={LABEL} value={7_000_000} color="danger" />,
    );
    expect(screen.getByText(/7\.000\.000.*RSD/).className).toContain(
      'text-danger',
    );
  });
});

describe('AllTimeTotalCard', () => {
  beforeEach(() => localStorage.clear());

  it('renders the Ukupno label and formatted value', async () => {
    await renderWithProviders(<AllTimeTotalCard value={12_500_000} />);
    expect(screen.getByText('Ukupno')).toBeInTheDocument();
    expect(screen.getByText(/12\.500\.000.*RSD/)).toBeInTheDocument();
  });
});

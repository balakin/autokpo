import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VALID_PROFILE } from 'tests/fixtures/entity-profile';
import { VALID_ENTRY, VALID_ENTRY_2 } from 'tests/fixtures/entry';
import { VALID_SIGNATURE } from 'tests/fixtures/signature';
import {
  renderWithProviders,
  resetTestDoc,
  seedEntries,
  seedProfile,
  seedSignature,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { WorkingLayout } from '../working-layout';

async function renderWorkingLayout() {
  return await renderWithProviders(<WorkingLayout />);
}

beforeEach(() => {
  resetTestDoc();
  seedProfile(VALID_PROFILE);
  seedSignature(VALID_SIGNATURE);
});

describe('WorkingLayout', () => {
  it('renders three tabs: Unosi, Profil, Potpis', async () => {
    await renderWorkingLayout();
    expect(screen.getByRole('tab', { name: 'Unosi' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Profil' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Potpis' })).toBeInTheDocument();
  });

  it('renders the "KPO unosi" heading in the Unosi tab', async () => {
    await renderWorkingLayout();
    expect(screen.getByText('KPO unosi')).toBeInTheDocument();
  });

  it('renders the "Dodaj unos" button', async () => {
    await renderWorkingLayout();
    expect(
      screen.getByRole('button', { name: 'Dodaj unos' }),
    ).toBeInTheDocument();
  });

  it('shows empty entries state when there are no entries', async () => {
    await renderWorkingLayout();
    expect(screen.getByText('Nema unetih stavki')).toBeInTheDocument();
  });

  it('shows a row for each saved entry', async () => {
    seedEntries([VALID_ENTRY, VALID_ENTRY_2]);
    await renderWorkingLayout();
    const rows = screen.getAllByRole('row');
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3);
  });

  it('renders entity profile data after switching to Profil tab', async () => {
    const user = userEvent.setup();
    await renderWorkingLayout();
    await user.click(screen.getByRole('tab', { name: 'Profil' }));
    expect(screen.getByText(VALID_PROFILE.pib)).toBeInTheDocument();
  });

  it('renders signature data after switching to Potpis tab', async () => {
    const user = userEvent.setup();
    await renderWorkingLayout();
    await user.click(screen.getByRole('tab', { name: 'Potpis' }));
    expect(screen.getByText(VALID_SIGNATURE.sastavioIme)).toBeInTheDocument();
    expect(
      screen.getByText(VALID_SIGNATURE.odgovornoLiceIme),
    ).toBeInTheDocument();
  });

  it('renders income progress bar in Unosi tab', async () => {
    await renderWorkingLayout();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getAllByText('Godišnji prihod').length).toBeGreaterThan(0);
    expect(screen.getByText(/Limit: 6\.000\.000/)).toBeInTheDocument();
  });

  it('shows 0,00 income when no entries exist', async () => {
    await renderWorkingLayout();
    expect(screen.getAllByText('0,00 RSD').length).toBeGreaterThan(0);
  });

  it('updates income when entries exist', async () => {
    seedEntries([VALID_ENTRY]); // odProdajeProizvoda=50_000
    await renderWorkingLayout();
    expect(screen.getAllByText('50.000,00 RSD').length).toBeGreaterThan(0);
  });

  it('applies success color when income is below 90% of annual limit', async () => {
    seedEntries([VALID_ENTRY]);
    await renderWorkingLayout();
    const el = screen.getAllByText('50.000,00 RSD')[0];
    expect(el.className).toContain('text-success');
  });

  it('income progress bar is not visible on Profil tab', async () => {
    const user = userEvent.setup();
    await renderWorkingLayout();
    await user.click(screen.getByRole('tab', { name: 'Profil' }));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

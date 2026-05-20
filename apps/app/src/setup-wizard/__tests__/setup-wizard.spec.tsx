import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VALID_PROFILE } from 'tests/fixtures/entity-profile';
import {
  renderWithProviders,
  resetTestDoc,
  seedProfile,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { SetupWizard } from '../setup-wizard';

async function renderWizardWithNav() {
  return await renderWithProviders(<SetupWizard />);
}

beforeEach(() => {
  resetTestDoc();
});

describe('SetupWizard', () => {
  it('renders start step when no profile and no signature', async () => {
    await renderWizardWithNav();
    expect(
      screen.getByRole('button', { name: /počnite/i }),
    ).toBeInTheDocument();
  });

  it('renders signature step when profile exists but signature is null', async () => {
    seedProfile(VALID_PROFILE);
    await renderWizardWithNav();
    expect(screen.getByLabelText('Sastavio')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /počnite/i }),
    ).not.toBeInTheDocument();
  });

  it('advancing from start to profile step works end-to-end', async () => {
    const user = userEvent.setup();
    await renderWizardWithNav();

    await user.click(screen.getByRole('button', { name: /počnite/i }));

    expect(screen.getByLabelText('PIB')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /počnite/i }),
    ).not.toBeInTheDocument();
  });

  it('submitting profile form advances to signature step without showing the dialog', async () => {
    const user = userEvent.setup();
    await renderWizardWithNav();

    await user.click(screen.getByRole('button', { name: /počnite/i }));
    await user.type(screen.getByLabelText('PIB'), VALID_PROFILE.pib);
    await user.type(screen.getByLabelText('Obveznik'), VALID_PROFILE.obveznik);
    await user.type(
      screen.getByLabelText('Firma-radnje'),
      VALID_PROFILE.firmaRadnje,
    );
    await user.type(screen.getByLabelText('Sedište'), VALID_PROFILE.sediste);
    await user.type(
      screen.getByLabelText('Šifra poreskog obveznika'),
      VALID_PROFILE.sifraPoreskogObveznika,
    );
    await user.type(
      screen.getByLabelText('Šifra delatnosti'),
      VALID_PROFILE.sifraDelatnosti,
    );
    await user.click(screen.getByRole('button', { name: /dalje/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Sastavio')).toBeInTheDocument();
    });
    expect(screen.queryByText('Napustiti stranicu?')).not.toBeInTheDocument();
  });

  describe('unsaved changes guard', () => {
    it('shows dialog when navigating away from dirty signature form', async () => {
      const user = userEvent.setup();
      seedProfile(VALID_PROFILE);
      await renderWizardWithNav();

      await user.type(screen.getByLabelText('Sastavio'), 'P');
      await user.click(screen.getByRole('button', { name: /profil/i }));

      expect(
        await screen.findByText('Napustiti stranicu?'),
      ).toBeInTheDocument();
    });

    it('navigates to target step when dialog is confirmed', async () => {
      const user = userEvent.setup();
      seedProfile(VALID_PROFILE);
      await renderWizardWithNav();

      await user.type(screen.getByLabelText('Sastavio'), 'P');
      await user.click(screen.getByRole('button', { name: /profil/i }));
      await user.click(
        await screen.findByRole('button', { name: /napustite/i }),
      );

      await waitFor(() => {
        expect(screen.getByLabelText('PIB')).toBeInTheDocument();
      });
      expect(screen.queryByText('Napustiti stranicu?')).not.toBeInTheDocument();
    });

    it('stays on current step when dialog is cancelled', async () => {
      const user = userEvent.setup();
      seedProfile(VALID_PROFILE);
      await renderWizardWithNav();

      await user.type(screen.getByLabelText('Sastavio'), 'P');
      await user.click(screen.getByRole('button', { name: /profil/i }));
      await user.click(
        await screen.findByRole('button', { name: /ostanite/i }),
      );

      expect(screen.getByLabelText('Sastavio')).toBeInTheDocument();
      expect(screen.queryByText('Napustiti stranicu?')).not.toBeInTheDocument();
    });
  });
});

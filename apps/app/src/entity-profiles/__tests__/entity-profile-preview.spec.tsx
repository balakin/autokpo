import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VALID_PROFILE } from 'tests/fixtures/entity-profile';
import {
  getTestDoc,
  renderWithProviders,
  seedProfile,
  TEST_BOOK_ID,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { useYDoc } from '../../crdt';
import { EntityProfilePreview } from '../entity-profile-preview';
import { profileMutations } from '../profile-mutations';
import { profileSelectors } from '../profile-selectors';

async function renderPreview() {
  function Harness() {
    const profile = useYDoc(profileSelectors.active(TEST_BOOK_ID));
    return (
      <EntityProfilePreview
        profile={profile}
        onSaveProfile={(nextProfile) => {
          profileMutations.save(getTestDoc(), TEST_BOOK_ID, nextProfile);
        }}
      />
    );
  }

  return await renderWithProviders(<Harness />);
}

beforeEach(() => {
  localStorage.clear();
});

describe('EntityProfilePreview', () => {
  it('renders nothing when no profile exists', async () => {
    const { container } = await renderPreview();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all six field values when profile exists', async () => {
    seedProfile(VALID_PROFILE);
    await renderPreview();

    expect(screen.getByText(VALID_PROFILE.pib)).toBeInTheDocument();
    expect(screen.getByText(VALID_PROFILE.obveznik)).toBeInTheDocument();
    expect(screen.getByText(VALID_PROFILE.firmaRadnje)).toBeInTheDocument();
    expect(screen.getByText(VALID_PROFILE.sediste)).toBeInTheDocument();
    expect(
      screen.getByText(VALID_PROFILE.sifraPoreskogObveznika),
    ).toBeInTheDocument();
    expect(screen.getByText(VALID_PROFILE.sifraDelatnosti)).toBeInTheDocument();
  });

  it('renders all six field labels', async () => {
    seedProfile(VALID_PROFILE);
    await renderPreview();

    expect(screen.getByText('PIB')).toBeInTheDocument();
    expect(screen.getByText('Obveznik')).toBeInTheDocument();
    expect(screen.getByText('Firma-radnje')).toBeInTheDocument();
    expect(screen.getByText('Sedište')).toBeInTheDocument();
    expect(screen.getByText('Šifra poreskog obveznika')).toBeInTheDocument();
    expect(screen.getByText('Šifra delatnosti')).toBeInTheDocument();
  });

  it('does not render any input fields', async () => {
    seedProfile(VALID_PROFILE);
    await renderPreview();

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders the "Uredi" button', async () => {
    seedProfile(VALID_PROFILE);
    await renderPreview();

    expect(screen.getByRole('button', { name: 'Uredi' })).toBeInTheDocument();
  });

  describe('modal', () => {
    it('opens with correct heading when "Uredi" is clicked', async () => {
      seedProfile(VALID_PROFILE);
      const user = userEvent.setup();
      await renderPreview();

      await user.click(screen.getByRole('button', { name: 'Uredi' }));
      await screen.findByRole('dialog');

      expect(
        screen.getByRole('heading', { name: 'Uredi profil' }),
      ).toBeInTheDocument();
    });

    it('opens with all form fields', async () => {
      seedProfile(VALID_PROFILE);
      const user = userEvent.setup();
      await renderPreview();

      await user.click(screen.getByRole('button', { name: 'Uredi' }));
      await screen.findByRole('dialog');

      expect(screen.getByLabelText('PIB')).toBeInTheDocument();
      expect(screen.getByLabelText('Obveznik')).toBeInTheDocument();
      expect(screen.getByLabelText('Firma-radnje')).toBeInTheDocument();
      expect(screen.getByLabelText('Sedište')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Šifra poreskog obveznika'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Šifra delatnosti')).toBeInTheDocument();
    });

    it('pre-populates fields with the current profile values', async () => {
      seedProfile(VALID_PROFILE);
      const user = userEvent.setup();
      await renderPreview();

      await user.click(screen.getByRole('button', { name: 'Uredi' }));
      await screen.findByRole('dialog');

      expect(screen.getByLabelText('PIB')).toHaveValue(VALID_PROFILE.pib);
      expect(screen.getByLabelText('Obveznik')).toHaveValue(
        VALID_PROFILE.obveznik,
      );
      expect(screen.getByLabelText('Firma-radnje')).toHaveValue(
        VALID_PROFILE.firmaRadnje,
      );
      expect(screen.getByLabelText('Sedište')).toHaveValue(
        VALID_PROFILE.sediste,
      );
      expect(screen.getByLabelText('Šifra poreskog obveznika')).toHaveValue(
        VALID_PROFILE.sifraPoreskogObveznika,
      );
      expect(screen.getByLabelText('Šifra delatnosti')).toHaveValue(
        VALID_PROFILE.sifraDelatnosti,
      );
    });

    it('closes without saving when "Otkaži" is clicked', async () => {
      seedProfile(VALID_PROFILE);
      const user = userEvent.setup();
      await renderPreview();

      await user.click(screen.getByRole('button', { name: 'Uredi' }));
      await screen.findByRole('dialog');

      await user.clear(screen.getByLabelText('PIB'));
      await user.type(screen.getByLabelText('PIB'), '999999999');

      await user.click(screen.getByRole('button', { name: 'Otkaži' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(screen.getByText(VALID_PROFILE.pib)).toBeInTheDocument();
    });

    it('closes and updates preview after successful save', async () => {
      seedProfile(VALID_PROFILE);
      const user = userEvent.setup();
      await renderPreview();

      await user.click(screen.getByRole('button', { name: 'Uredi' }));
      await screen.findByRole('dialog');

      await user.clear(screen.getByLabelText('PIB'));
      await user.type(screen.getByLabelText('PIB'), '999999999');

      await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(screen.getByText('999999999')).toBeInTheDocument();
    });
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VALID_PROFILE } from 'tests/fixtures/entity-profile';
import {
  getSeededProfile,
  getTestDoc,
  renderWithProviders,
  resetTestDoc,
  seedProfile,
  TEST_BOOK_ID,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EntityProfileForm } from '../entity-profile-form';
import { profileMutations } from '../profile-mutations';

const FORM_ID = 'entity-profile-form-test';

async function renderForm(onSuccess?: () => void) {
  const profile = getSeededProfile();
  return await renderWithProviders(
    <>
      <EntityProfileForm
        formId={FORM_ID}
        profile={profile}
        onSaveProfile={(nextProfile) => {
          profileMutations.save(getTestDoc(), TEST_BOOK_ID, nextProfile);
        }}
        onSuccess={onSuccess}
      />
      <button type="submit" form={FORM_ID}>
        Sačuvaj
      </button>
    </>,
  );
}

beforeEach(() => {
  resetTestDoc();
});

describe('EntityProfileForm', () => {
  // no internal submit button
  it('does not render a submit button inside the form', async () => {
    await renderWithProviders(
      <EntityProfileForm
        formId={FORM_ID}
        profile={null}
        onSaveProfile={() => {}}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // 5.2 — all six fields with correct Serbian labels
  it('renders all six fields with correct Serbian labels', async () => {
    await renderForm();
    expect(screen.getByLabelText('PIB')).toBeInTheDocument();
    expect(screen.getByLabelText('Obveznik')).toBeInTheDocument();
    expect(screen.getByLabelText('Firma-radnje')).toBeInTheDocument();
    expect(screen.getByLabelText('Sedište')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Šifra poreskog obveznika'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Šifra delatnosti')).toBeInTheDocument();
  });

  // 5.3 — empty submit shows "Polje je obavezno" for each field
  it('shows "Polje je obavezno" for each empty field on submit', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

    const errors = await screen.findAllByText('Polje je obavezno');
    expect(errors).toHaveLength(6);
  });

  // 5.4 — invalid PIB (wrong length) shows correct error
  it('shows "PIB mora imati tačno 9 cifara" for wrong-length PIB', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.type(screen.getByLabelText('PIB'), '12345678');
    await user.type(screen.getByLabelText('Obveznik'), 'Test');
    await user.type(screen.getByLabelText('Firma-radnje'), 'Test');
    await user.type(screen.getByLabelText('Sedište'), 'Beograd');
    await user.type(
      screen.getByLabelText('Šifra poreskog obveznika'),
      '12345678',
    );
    await user.type(screen.getByLabelText('Šifra delatnosti'), '6201');
    await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

    expect(
      await screen.findByText('PIB mora imati tačno 9 cifara'),
    ).toBeInTheDocument();
  });

  // 5.5 — invalid Šifra poreskog obveznika shows correct error
  it('shows correct error for invalid Šifra poreskog obveznika', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.type(screen.getByLabelText('PIB'), '123456789');
    await user.type(screen.getByLabelText('Obveznik'), 'Test');
    await user.type(screen.getByLabelText('Firma-radnje'), 'Test');
    await user.type(screen.getByLabelText('Sedište'), 'Beograd');
    await user.type(
      screen.getByLabelText('Šifra poreskog obveznika'),
      '1234567',
    );
    await user.type(screen.getByLabelText('Šifra delatnosti'), '6201');
    await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

    expect(
      await screen.findByText(
        'Šifra poreskog obveznika mora imati tačno 8 cifara',
      ),
    ).toBeInTheDocument();
  });

  // 5.6 — invalid Šifra delatnosti shows correct error
  it('shows correct error for invalid Šifra delatnosti', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.type(screen.getByLabelText('PIB'), '123456789');
    await user.type(screen.getByLabelText('Obveznik'), 'Test');
    await user.type(screen.getByLabelText('Firma-radnje'), 'Test');
    await user.type(screen.getByLabelText('Sedište'), 'Beograd');
    await user.type(
      screen.getByLabelText('Šifra poreskog obveznika'),
      '12345678',
    );
    await user.type(screen.getByLabelText('Šifra delatnosti'), '620');
    await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

    expect(
      await screen.findByText('Šifra delatnosti mora imati tačno 4 cifre'),
    ).toBeInTheDocument();
  });

  // 5.7 — valid submit calls saveProfile (profile persisted to localStorage)
  it('calls saveProfile when a valid profile is submitted', async () => {
    const user = userEvent.setup();
    await renderForm();

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
    await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

    expect(await screen.findByText('Profil je sačuvan')).toBeInTheDocument();
    expect(getSeededProfile()).toEqual(VALID_PROFILE);
  });

  // onSuccess called on valid submit
  it('calls onSuccess after valid submit', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    await renderForm(onSuccess);

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
    await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it('calls onDirtyChange(true) when a field is modified', async () => {
    const user = userEvent.setup();
    const onDirtyChange = vi.fn();
    await renderWithProviders(
      <EntityProfileForm
        formId={FORM_ID}
        profile={null}
        onSaveProfile={() => {}}
        onDirtyChange={onDirtyChange}
      />,
    );
    await user.type(screen.getByLabelText('PIB'), '1');
    await waitFor(() => {
      expect(onDirtyChange).toHaveBeenCalledWith(true);
    });
  });

  // 5.8 — form pre-populates when context profile is non-null
  it('pre-populates fields when a saved profile exists', async () => {
    seedProfile(VALID_PROFILE);
    await renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText('PIB')).toHaveValue(VALID_PROFILE.pib);
    });
    expect(screen.getByLabelText('Obveznik')).toHaveValue(
      VALID_PROFILE.obveznik,
    );
    expect(screen.getByLabelText('Firma-radnje')).toHaveValue(
      VALID_PROFILE.firmaRadnje,
    );
    expect(screen.getByLabelText('Sedište')).toHaveValue(VALID_PROFILE.sediste);
    expect(screen.getByLabelText('Šifra poreskog obveznika')).toHaveValue(
      VALID_PROFILE.sifraPoreskogObveznika,
    );
    expect(screen.getByLabelText('Šifra delatnosti')).toHaveValue(
      VALID_PROFILE.sifraDelatnosti,
    );
  });
});

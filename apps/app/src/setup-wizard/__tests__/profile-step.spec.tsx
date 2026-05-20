import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VALID_PROFILE } from 'tests/fixtures/entity-profile';
import {
  getTestDoc,
  renderWithProviders,
  TEST_BOOK_ID,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EntityProfile } from '../../entity-profiles/entity-profile-schema';
import { profileMutations } from '../../entity-profiles/profile-mutations';
import { ProfileStep } from '../profile-step';

function createSaveProfile() {
  const doc = getTestDoc();
  return (profile: EntityProfile) =>
    profileMutations.save(doc, TEST_BOOK_ID, profile);
}

async function fillAndSubmitValidProfile(
  user: ReturnType<typeof userEvent.setup>,
) {
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
  await user.click(screen.getByRole('button', { name: 'Dalje' }));
}

beforeEach(() => {
  localStorage.clear();
});

describe('ProfileStep', () => {
  it('submitting a valid form calls onNext', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    await renderWithProviders(
      <ProfileStep
        profile={null}
        onSaveProfile={createSaveProfile()}
        onNext={onNext}
      />,
    );

    await fillAndSubmitValidProfile(user);

    await waitFor(() => {
      expect(onNext).toHaveBeenCalledOnce();
    });
  });
});

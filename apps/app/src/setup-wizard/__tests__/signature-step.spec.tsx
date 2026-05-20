import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VALID_SIGNATURE } from 'tests/fixtures/signature';
import {
  getSeededSignature,
  getTestDoc,
  renderWithProviders,
  TEST_BOOK_ID,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { signatureMutations } from '../../signatures/signature-mutations';
import type { Signature } from '../../signatures/signature-schema';
import { SignatureStep } from '../signature-step';

function createSaveSignature() {
  const doc = getTestDoc();
  return (sig: Signature) => signatureMutations.save(doc, TEST_BOOK_ID, sig);
}

beforeEach(() => {
  localStorage.clear();
});

describe('SignatureStep', () => {
  it('renders the Potpis heading', async () => {
    await renderWithProviders(
      <SignatureStep saveSignature={createSaveSignature()} />,
    );
    expect(screen.getByRole('heading', { name: 'Potpis' })).toBeInTheDocument();
  });

  it('renders the Sačuvaj submit button', async () => {
    await renderWithProviders(
      <SignatureStep saveSignature={createSaveSignature()} />,
    );
    expect(screen.getByRole('button', { name: 'Sačuvaj' })).toBeInTheDocument();
  });

  it('submitting valid values saves the signature', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <SignatureStep saveSignature={createSaveSignature()} />,
    );

    await user.type(
      screen.getByLabelText('Sastavio'),
      VALID_SIGNATURE.sastavioIme,
    );
    await user.type(
      screen.getByLabelText('Odgovorno lice'),
      VALID_SIGNATURE.odgovornoLiceIme,
    );
    await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

    expect(await screen.findByText('Potpis je sačuvan')).toBeInTheDocument();
    expect(getSeededSignature()).toEqual(VALID_SIGNATURE);
  });
});

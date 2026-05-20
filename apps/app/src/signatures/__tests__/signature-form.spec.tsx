import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VALID_SIGNATURE } from 'tests/fixtures/signature';
import {
  getSeededSignature,
  getTestDoc,
  renderWithProviders,
  seedSignature,
  TEST_BOOK_ID,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SignatureForm } from '../signature-form';
import { signatureMutations } from '../signature-mutations';
import type { Signature } from '../signature-schema';

const FORM_ID = 'signature-form-test';

function createSaveSignature() {
  const doc = getTestDoc();
  return (sig: Signature) => signatureMutations.save(doc, TEST_BOOK_ID, sig);
}

async function renderForm(
  onSuccess?: () => void,
  signature?: Signature | null,
) {
  return await renderWithProviders(
    <>
      <SignatureForm
        formId={FORM_ID}
        signature={signature}
        saveSignature={createSaveSignature()}
        onSuccess={onSuccess}
      />
      <button type="submit" form={FORM_ID}>
        Sačuvaj
      </button>
    </>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('SignatureForm', () => {
  // no internal submit button
  it('does not render a submit button inside the form', async () => {
    await renderWithProviders(
      <SignatureForm formId={FORM_ID} saveSignature={createSaveSignature()} />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // 4.1 — renders both fields with correct Serbian labels
  it('renders both fields with correct Serbian labels', async () => {
    await renderForm();
    expect(screen.getByLabelText('Sastavio')).toBeInTheDocument();
    expect(screen.getByLabelText('Odgovorno lice')).toBeInTheDocument();
  });

  // 4.2 — submitting with empty fields shows "Polje je obavezno" for each
  it('shows "Polje je obavezno" for each empty field on submit', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

    const errors = await screen.findAllByText('Polje je obavezno');
    expect(errors).toHaveLength(2);
  });

  // 4.3 — submitting valid values calls context save action
  it('calls saveSignature when valid values are submitted', async () => {
    const user = userEvent.setup();
    await renderForm();

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

  // onSuccess called on valid submit
  it('calls onSuccess after valid submit', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    await renderForm(onSuccess);

    await user.type(
      screen.getByLabelText('Sastavio'),
      VALID_SIGNATURE.sastavioIme,
    );
    await user.type(
      screen.getByLabelText('Odgovorno lice'),
      VALID_SIGNATURE.odgovornoLiceIme,
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
      <SignatureForm
        formId={FORM_ID}
        saveSignature={createSaveSignature()}
        onDirtyChange={onDirtyChange}
      />,
    );
    await user.type(screen.getByLabelText('Sastavio'), 'P');
    await waitFor(() => {
      expect(onDirtyChange).toHaveBeenCalledWith(true);
    });
  });

  // 4.4 — form pre-populates when a saved signature exists
  it('pre-populates fields when a saved signature exists', async () => {
    seedSignature(VALID_SIGNATURE);
    await renderForm(undefined, getSeededSignature());

    await waitFor(() => {
      expect(screen.getByLabelText('Sastavio')).toHaveValue(
        VALID_SIGNATURE.sastavioIme,
      );
    });
    expect(screen.getByLabelText('Odgovorno lice')).toHaveValue(
      VALID_SIGNATURE.odgovornoLiceIme,
    );
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VALID_SIGNATURE } from 'tests/fixtures/signature';
import {
  getTestDoc,
  renderWithProviders,
  seedSignature,
  TEST_BOOK_ID,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { useYDoc } from '../../crdt/use-y-doc';
import { signatureMutations } from '../signature-mutations';
import { SignaturePreview } from '../signature-preview';
import type { Signature } from '../signature-schema';
import { signatureSelectors } from '../signature-selectors';

function createSaveSignature() {
  const doc = getTestDoc();
  return (sig: Signature) => signatureMutations.save(doc, TEST_BOOK_ID, sig);
}

function SignaturePreviewHarness() {
  const signature = useYDoc(signatureSelectors.active(TEST_BOOK_ID));
  return (
    <SignaturePreview
      signature={signature}
      saveSignature={createSaveSignature()}
    />
  );
}

async function renderPreview() {
  return await renderWithProviders(<SignaturePreviewHarness />);
}

beforeEach(() => {
  localStorage.clear();
});

describe('SignaturePreview', () => {
  it('renders nothing when no signature exists', async () => {
    const { container } = await renderPreview();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders both field values when signature exists', async () => {
    seedSignature(VALID_SIGNATURE);
    await renderPreview();

    expect(screen.getByText(VALID_SIGNATURE.sastavioIme)).toBeInTheDocument();
    expect(
      screen.getByText(VALID_SIGNATURE.odgovornoLiceIme),
    ).toBeInTheDocument();
  });

  it('renders both field labels', async () => {
    seedSignature(VALID_SIGNATURE);
    await renderPreview();

    expect(screen.getByText('Sastavio')).toBeInTheDocument();
    expect(screen.getByText('Odgovorno lice')).toBeInTheDocument();
  });

  it('does not render any input fields', async () => {
    seedSignature(VALID_SIGNATURE);
    await renderPreview();

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders the "Uredi" button', async () => {
    seedSignature(VALID_SIGNATURE);
    await renderPreview();

    expect(screen.getByRole('button', { name: 'Uredi' })).toBeInTheDocument();
  });

  describe('modal', () => {
    it('opens with correct heading when "Uredi" is clicked', async () => {
      seedSignature(VALID_SIGNATURE);
      const user = userEvent.setup();
      await renderPreview();

      await user.click(screen.getByRole('button', { name: 'Uredi' }));
      await screen.findByRole('dialog');

      expect(
        screen.getByRole('heading', { name: 'Uredi potpis' }),
      ).toBeInTheDocument();
    });

    it('opens with both form fields', async () => {
      seedSignature(VALID_SIGNATURE);
      const user = userEvent.setup();
      await renderPreview();

      await user.click(screen.getByRole('button', { name: 'Uredi' }));
      await screen.findByRole('dialog');

      expect(screen.getByLabelText('Sastavio')).toBeInTheDocument();
      expect(screen.getByLabelText('Odgovorno lice')).toBeInTheDocument();
    });

    it('pre-populates fields with the current signature values', async () => {
      seedSignature(VALID_SIGNATURE);
      const user = userEvent.setup();
      await renderPreview();

      await user.click(screen.getByRole('button', { name: 'Uredi' }));
      await screen.findByRole('dialog');

      expect(screen.getByLabelText('Sastavio')).toHaveValue(
        VALID_SIGNATURE.sastavioIme,
      );
      expect(screen.getByLabelText('Odgovorno lice')).toHaveValue(
        VALID_SIGNATURE.odgovornoLiceIme,
      );
    });

    it('closes without saving when "Otkaži" is clicked', async () => {
      seedSignature(VALID_SIGNATURE);
      const user = userEvent.setup();
      await renderPreview();

      await user.click(screen.getByRole('button', { name: 'Uredi' }));
      await screen.findByRole('dialog');

      await user.clear(screen.getByLabelText('Sastavio'));
      await user.type(screen.getByLabelText('Sastavio'), 'Novi Ime');

      await user.click(screen.getByRole('button', { name: 'Otkaži' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(screen.getByText(VALID_SIGNATURE.sastavioIme)).toBeInTheDocument();
    });

    it('closes and updates preview after successful save', async () => {
      seedSignature(VALID_SIGNATURE);
      const user = userEvent.setup();
      await renderPreview();

      await user.click(screen.getByRole('button', { name: 'Uredi' }));
      await screen.findByRole('dialog');

      await user.clear(screen.getByLabelText('Sastavio'));
      await user.type(screen.getByLabelText('Sastavio'), 'Novi Ime');

      await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText('Novi Ime')).toBeInTheDocument();
      });
    });
  });
});

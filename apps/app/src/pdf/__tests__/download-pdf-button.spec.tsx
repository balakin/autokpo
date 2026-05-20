import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VALID_PROFILE } from 'tests/fixtures/entity-profile';
import { VALID_ENTRY } from 'tests/fixtures/entry';
import { VALID_SIGNATURE } from 'tests/fixtures/signature';
import {
  renderWithProviders,
  resetTestDoc,
  seedBook,
  seedEntries,
  seedProfile,
  seedSignature,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DownloadPdfButton } from '../download-pdf-button';

const TEST_BOOK_A = '00000000-0000-4000-8000-000000000001';
const TEST_BOOK_B = '00000000-0000-4000-8000-000000000002';

const mockDownloadPdf = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('../download-pdf', () => ({
  downloadPdf: mockDownloadPdf,
}));

async function renderButton() {
  return await renderWithProviders(<DownloadPdfButton />);
}

describe('DownloadPdfButton', () => {
  beforeEach(() => {
    resetTestDoc();
    vi.restoreAllMocks();
    mockDownloadPdf.mockClear();
  });

  it('renders the download button', async () => {
    await renderButton();
    expect(
      screen.getByRole('button', { name: 'Preuzmi PDF' }),
    ).toBeInTheDocument();
  });

  describe('button disabled state', () => {
    it('is disabled when profile and signature are missing', async () => {
      await renderButton();
      expect(
        screen.getByRole('button', { name: 'Preuzmi PDF' }),
      ).toBeDisabled();
    });

    it('is disabled when only profile is set', async () => {
      seedProfile(VALID_PROFILE);
      await renderButton();
      expect(
        screen.getByRole('button', { name: 'Preuzmi PDF' }),
      ).toBeDisabled();
    });

    it('is disabled when only signature is set', async () => {
      seedSignature(VALID_SIGNATURE);
      await renderButton();
      expect(
        screen.getByRole('button', { name: 'Preuzmi PDF' }),
      ).toBeDisabled();
    });

    it('is enabled when both profile and signature are set', async () => {
      seedProfile(VALID_PROFILE);
      seedSignature(VALID_SIGNATURE);
      await renderButton();
      expect(
        screen.getByRole('button', { name: 'Preuzmi PDF' }),
      ).not.toBeDisabled();
    });
  });

  describe('on button press', () => {
    beforeEach(() => {
      seedProfile(VALID_PROFILE);
      seedSignature(VALID_SIGNATURE);
      seedEntries([VALID_ENTRY]);
    });

    it('calls downloadPdf with entries, profile, and signature', async () => {
      const user = userEvent.setup();

      await renderButton();
      await user.click(screen.getByRole('button', { name: 'Preuzmi PDF' }));

      expect(mockDownloadPdf).toHaveBeenCalledWith(
        [VALID_ENTRY],
        VALID_PROFILE,
        VALID_SIGNATURE,
      );
    });
  });

  describe('book isolation', () => {
    it('generates PDF with only book A data when book B also exists', async () => {
      const user = userEvent.setup();

      const profileA = { ...VALID_PROFILE, pib: '123456789' };
      const signatureA = { ...VALID_SIGNATURE, sastavioIme: 'Book A Author' };
      const entryA = { ...VALID_ENTRY, opisPrometa: 'Entry from book A' };

      const profileB = { ...VALID_PROFILE, pib: '987654321' };
      const signatureB = { ...VALID_SIGNATURE, sastavioIme: 'Book B Author' };
      const entryB = { ...VALID_ENTRY, opisPrometa: 'Entry from book B' };

      // Seed book A (the one we'll view) with its profile/sig/entries
      // and book B with different data
      seedBook(TEST_BOOK_A, {
        year: 2024,
        profile: profileA,
        signature: signatureA,
        entries: [entryA],
      });
      seedBook(TEST_BOOK_B, {
        year: 2025,
        profile: profileB,
        signature: signatureB,
        entries: [entryB],
      });

      await renderWithProviders(<DownloadPdfButton />, { bookId: TEST_BOOK_A });

      await user.click(screen.getByRole('button', { name: 'Preuzmi PDF' }));

      expect(mockDownloadPdf).toHaveBeenCalledWith(
        [entryA],
        profileA,
        signatureA,
      );
      expect(mockDownloadPdf).not.toHaveBeenCalledWith(
        [entryB],
        profileB,
        signatureB,
      );
    });
  });
});

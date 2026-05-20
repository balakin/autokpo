import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VALID_ENTRY, VALID_ENTRY_2 } from 'tests/fixtures/entry';
import {
  getTestDoc,
  renderWithProviders,
  resetTestDoc,
  seedEntries,
  TEST_BOOK_ID,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import { useYDoc } from '../../crdt/use-y-doc';
import { EntriesTable } from '../entries-table';
import { entryMutations } from '../entry-mutations';
import { entrySelectors } from '../entry-selectors';

function EntriesTableHarness() {
  const entries = useYDoc(entrySelectors.all(TEST_BOOK_ID));
  const doc = getTestDoc();
  return (
    <EntriesTable
      entries={entries}
      year={2025}
      onDeleteEntry={(id: string) =>
        entryMutations.remove(doc, TEST_BOOK_ID, id)
      }
    />
  );
}

async function renderTable() {
  await renderWithProviders(<EntriesTableHarness />);
}

describe('EntriesTable', () => {
  beforeEach(() => {
    resetTestDoc();
  });

  describe('empty state', () => {
    it('shows empty state message when there are no entries', async () => {
      await renderTable();
      expect(screen.getByText('Nema unetih stavki')).toBeInTheDocument();
    });
  });

  describe('with entries', () => {
    beforeEach(() => {
      seedEntries([VALID_ENTRY, VALID_ENTRY_2]);
    });

    it('renders a row for each entry', async () => {
      await renderTable();
      const rows = screen.getAllByRole('row');
      // 1 header row + 2 data rows
      expect(rows).toHaveLength(3);
    });

    it('shows sequential row numbers', async () => {
      await renderTable();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows the formatted date for each entry', async () => {
      await renderTable();
      // 2025-03-15 → 15.03.2025.
      expect(screen.getByText('15.03.2025.')).toBeInTheDocument();
      // 2025-01-10 → 10.01.2025.
      expect(screen.getByText('10.01.2025.')).toBeInTheDocument();
    });

    it('shows the opis prometa for each entry', async () => {
      await renderTable();
      expect(screen.getByText(VALID_ENTRY.opisPrometa)).toBeInTheDocument();
      expect(screen.getByText(VALID_ENTRY_2.opisPrometa)).toBeInTheDocument();
    });

    it('shows formatted od prodaje proizvoda values', async () => {
      await renderTable();
      // 50000 → 50.000,00 (appears in both the column and svega column)
      expect(screen.getAllByText('50.000,00').length).toBeGreaterThanOrEqual(1);
    });

    it('shows formatted od izvrsenih usluga values', async () => {
      await renderTable();
      // 30000 → 30.000,00 (appears in both the column and svega column)
      expect(screen.getAllByText('30.000,00').length).toBeGreaterThanOrEqual(1);
    });

    it('shows correct svega (total) for each entry', async () => {
      await renderTable();
      // VALID_ENTRY: 50000 + 0 = 50000 → 50.000,00 (same cell value, appears twice)
      const fiftyThousand = screen.getAllByText('50.000,00');
      expect(fiftyThousand.length).toBeGreaterThanOrEqual(2);

      // VALID_ENTRY_2: 0 + 30000 = 30000 → 30.000,00 (same cell value, appears twice)
      const thirtyThousand = screen.getAllByText('30.000,00');
      expect(thirtyThousand.length).toBeGreaterThanOrEqual(2);
    });

    it('renders Uredi and Obriši buttons for each entry', async () => {
      await renderTable();
      expect(screen.getAllByRole('button', { name: 'Uredi' })).toHaveLength(2);
      expect(screen.getAllByRole('button', { name: 'Obriši' })).toHaveLength(2);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      seedEntries([VALID_ENTRY]);
    });

    it('opens a confirmation modal when the delete button is pressed', async () => {
      const user = userEvent.setup();
      await renderTable();

      await user.click(screen.getByRole('button', { name: 'Obriši' }));

      expect(screen.getByText('Obrisati unos?')).toBeInTheDocument();
    });

    it('removes the entry after confirming deletion', async () => {
      const user = userEvent.setup();
      await renderTable();

      await user.click(screen.getByRole('button', { name: 'Obriši' }));
      const dialog = screen.getByRole('alertdialog');
      await user.click(within(dialog).getByRole('button', { name: 'Obriši' }));

      await waitFor(() => {
        expect(screen.getByText('Nema unetih stavki')).toBeInTheDocument();
      });
    });

    it('keeps the entry when deletion is cancelled', async () => {
      const user = userEvent.setup();
      await renderTable();

      await user.click(screen.getByRole('button', { name: 'Obriši' }));
      await user.click(screen.getByRole('button', { name: 'Otkaži' }));

      expect(screen.getByText(VALID_ENTRY.opisPrometa)).toBeInTheDocument();
    });
  });

  describe('edit', () => {
    beforeEach(() => {
      seedEntries([VALID_ENTRY]);
    });

    it('opens the edit modal when Uredi is clicked', async () => {
      const user = userEvent.setup();
      await renderTable();

      await user.click(screen.getByRole('button', { name: 'Uredi' }));

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('shows "Uredi unos" heading in the edit modal', async () => {
      const user = userEvent.setup();
      await renderTable();

      await user.click(screen.getByRole('button', { name: 'Uredi' }));
      await screen.findByRole('dialog');

      expect(screen.getByText('Uredi unos')).toBeInTheDocument();
    });
  });
});

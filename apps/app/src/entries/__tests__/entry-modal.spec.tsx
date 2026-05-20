import { Button } from '@heroui/react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VALID_ENTRY } from 'tests/fixtures/entry';
import {
  getSeededEntries,
  getTestDoc,
  renderWithProviders,
  resetTestDoc,
  seedEntries,
  TEST_BOOK_ID,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it } from 'vitest';

import type { KpoEntry } from '../entries-schema';
import { EntryModal } from '../entry-modal';
import { entryMutations } from '../entry-mutations';

const TEST_YEAR = 2025;

function createSaveEntry() {
  const doc = getTestDoc();
  return (entry: KpoEntry) => {
    if (getSeededEntries().some((e) => e.id === entry.id)) {
      entryMutations.update(doc, TEST_BOOK_ID, entry);
    } else {
      entryMutations.add(doc, TEST_BOOK_ID, entry);
    }
  };
}

async function renderModal(entryId?: string) {
  const entries = getSeededEntries();
  const entry = entryId ? entries.find((e) => e.id === entryId) : undefined;
  await renderWithProviders(
    <EntryModal entry={entry} year={TEST_YEAR} onSaveEntry={createSaveEntry()}>
      <Button>Otvori</Button>
    </EntryModal>,
  );
}

async function openModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Otvori' }));
  await screen.findByRole('dialog');
}

async function fillDate(
  user: ReturnType<typeof userEvent.setup>,
  dateStr: string,
) {
  const [year, month, day] = dateStr.split('-');
  const spinbuttons = screen.getAllByRole('spinbutton');
  const hasToken = (label: string | null, tokens: string[]) =>
    tokens.some((token) => label?.toLowerCase().includes(token));
  const monthSeg = spinbuttons.find((s) =>
    hasToken(s.getAttribute('aria-label'), ['mesec', 'month']),
  );
  const daySeg = spinbuttons.find((s) =>
    hasToken(s.getAttribute('aria-label'), ['dan', 'day']),
  );
  const yearSeg = spinbuttons.find((s) =>
    hasToken(s.getAttribute('aria-label'), ['godina', 'year']),
  );
  if (monthSeg) {
    await user.click(monthSeg);
    await user.keyboard(month);
  }
  if (daySeg) {
    await user.click(daySeg);
    await user.keyboard(day);
  }
  if (yearSeg) {
    await user.click(yearSeg);
    await user.keyboard(year);
  }
}

describe('EntryModal', () => {
  beforeEach(() => {
    resetTestDoc();
  });

  it('renders the trigger', async () => {
    await renderModal();
    expect(screen.getByRole('button', { name: 'Otvori' })).toBeInTheDocument();
  });

  describe('add mode (no id)', () => {
    it('opens modal with "Novi unos" heading on trigger click', async () => {
      const user = userEvent.setup();
      await renderModal();
      await openModal(user);
      expect(screen.getByText('Novi unos')).toBeInTheDocument();
    });

    it('shows add subtitle', async () => {
      const user = userEvent.setup();
      await renderModal();
      await openModal(user);
      expect(
        screen.getByText('Unesite podatke novog unosa.'),
      ).toBeInTheDocument();
    });

    it('shows validation errors on empty submit', async () => {
      const user = userEvent.setup();
      await renderModal();
      await openModal(user);

      await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

      const errors = await screen.findAllByText('Polje je obavezno');
      expect(errors).toHaveLength(4);
    });

    it('dispatches ADD_ENTRY and closes modal on valid submit', async () => {
      const user = userEvent.setup();
      await renderModal();
      await openModal(user);

      await fillDate(user, VALID_ENTRY.datumPrometa);
      await user.type(
        screen.getByLabelText('Opis prometa'),
        VALID_ENTRY.opisPrometa,
      );
      await user.type(
        screen.getByLabelText('Od prodaje proizvoda'),
        VALID_ENTRY.odProdajeProizvoda.toString(),
      );
      await user.type(
        screen.getByLabelText('Od izvršenih usluga'),
        VALID_ENTRY.odIzvrsenihUsluga.toString(),
      );

      await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

      await waitFor(() => {
        expect(screen.queryByText('Novi unos')).not.toBeInTheDocument();
      });

      const stored = getSeededEntries();
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        datumPrometa: VALID_ENTRY.datumPrometa,
        opisPrometa: VALID_ENTRY.opisPrometa,
        odProdajeProizvoda: VALID_ENTRY.odProdajeProizvoda,
        odIzvrsenihUsluga: VALID_ENTRY.odIzvrsenihUsluga,
      });
    });
  });

  describe('edit mode (with id)', () => {
    beforeEach(() => {
      seedEntries([VALID_ENTRY]);
    });

    it('opens modal with "Uredi unos" heading on trigger click', async () => {
      const user = userEvent.setup();
      await renderModal(VALID_ENTRY.id);
      await openModal(user);
      expect(screen.getByText('Uredi unos')).toBeInTheDocument();
    });

    it('shows edit subtitle', async () => {
      const user = userEvent.setup();
      await renderModal(VALID_ENTRY.id);
      await openModal(user);
      expect(screen.getByText('Izmijenite podatke unosa.')).toBeInTheDocument();
    });

    it('pre-populates opis prometa with existing entry value', async () => {
      const user = userEvent.setup();
      await renderModal(VALID_ENTRY.id);
      await openModal(user);
      await waitFor(() => {
        expect(screen.getByLabelText('Opis prometa')).toHaveValue(
          VALID_ENTRY.opisPrometa,
        );
      });
    });

    it('dispatches UPDATE_ENTRY and closes modal on submit', async () => {
      const user = userEvent.setup();
      await renderModal(VALID_ENTRY.id);
      await openModal(user);

      const opisInput = screen.getByLabelText('Opis prometa');
      await user.clear(opisInput);
      await user.type(opisInput, 'Izmijenjeni opis');

      await user.click(screen.getByRole('button', { name: 'Sačuvaj' }));

      await waitFor(() => {
        expect(screen.queryByText('Uredi unos')).not.toBeInTheDocument();
      });

      const stored = getSeededEntries();
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        id: VALID_ENTRY.id,
        opisPrometa: 'Izmijenjeni opis',
      });
    });
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    await renderModal();
    await openModal(user);

    await user.click(screen.getByRole('button', { name: 'Otkaži' }));

    await waitFor(() => {
      expect(screen.queryByText('Novi unos')).not.toBeInTheDocument();
    });
  });
});

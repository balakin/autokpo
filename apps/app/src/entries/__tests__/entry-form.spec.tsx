import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VALID_ENTRY } from 'tests/fixtures/entry';
import {
  renderWithProviders,
  resetTestDoc,
  seedEntries,
} from 'tests/render-helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useCurrencies,
  useExchangeRate,
} from '../../currency/use-exchange-rates';
import { type KpoEntry, type EntryModelData } from '../entries-schema';
import { EntryForm } from '../entry-form';

vi.mock('../../currency/use-exchange-rates', () => ({
  useCurrencies: vi
    .fn()
    .mockReturnValue({ data: [], isPending: false, isError: false }),
  useExchangeRate: vi.fn().mockReturnValue({
    data: undefined,
    isPending: true,
    isError: false,
    refetch: vi.fn(),
  }),
}));

const MOCK_RATE = {
  exchange_middle: 117.0,
  parity: 1,
  date: VALID_ENTRY.datumPrometa,
  date_from: VALID_ENTRY.datumPrometa,
};

const FORM_ID = 'entry-form-test';

async function renderForm(entry?: KpoEntry) {
  const onSuccess = vi.fn<(data: EntryModelData) => void>();
  await renderWithProviders(
    <>
      <EntryForm
        formId={FORM_ID}
        entry={entry}
        year={2025}
        onSuccess={onSuccess}
      />
      <button type="submit" form={FORM_ID}>
        Potvrdi
      </button>
    </>,
  );
  return { onSuccess };
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

/** The datalist is exposed to the a11y tree as a hidden listbox. */
function getDescriptionDatalist(): HTMLDataListElement {
  const datalist = screen.getByRole('listbox', { hidden: true });
  const listId = screen.getByLabelText('Opis prometa').getAttribute('list');
  expect(listId).toBeTruthy();
  expect(datalist.id).toBe(listId);
  return datalist as HTMLDataListElement;
}

function datalistValues(): string[] {
  return within(getDescriptionDatalist())
    .queryAllByRole('option', { hidden: true })
    .map((option) => (option as HTMLOptionElement).value);
}

function suggestionEntry(index: number, opisPrometa: string): KpoEntry {
  return {
    ...VALID_ENTRY,
    id: `00000000-0000-4000-8000-0000000001${index.toString().padStart(2, '0')}`,
    datumPrometa: `2025-03-${(index + 1).toString().padStart(2, '0')}`,
    opisPrometa,
  };
}

describe('EntryForm', () => {
  beforeEach(() => {
    resetTestDoc();
  });

  it('renders all fields with correct Serbian labels', async () => {
    await renderForm();
    expect(screen.getByText('Datum prometa')).toBeInTheDocument();
    expect(screen.getByLabelText('Opis prometa')).toBeInTheDocument();
    expect(screen.getByLabelText('Od prodaje proizvoda')).toBeInTheDocument();
    expect(screen.getByLabelText('Od izvršenih usluga')).toBeInTheDocument();
  });

  it('shows "Polje je obavezno" for all empty required fields on submit', async () => {
    const user = userEvent.setup();
    await renderForm();

    await user.click(screen.getByRole('button', { name: 'Potvrdi' }));

    const errors = await screen.findAllByText('Polje je obavezno');
    expect(errors).toHaveLength(4);
  });

  it('calls onSuccess with correct data on valid submit', async () => {
    const user = userEvent.setup();
    const { onSuccess } = await renderForm();

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

    await user.click(screen.getByRole('button', { name: 'Potvrdi' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({
        datumPrometa: VALID_ENTRY.datumPrometa,
        opisPrometa: VALID_ENTRY.opisPrometa,
        odProdajeProizvoda: VALID_ENTRY.odProdajeProizvoda,
        odIzvrsenihUsluga: VALID_ENTRY.odIzvrsenihUsluga,
      });
    });
  });

  it('pre-populates text fields when entry prop is provided', async () => {
    await renderForm(VALID_ENTRY);

    await waitFor(() => {
      expect(screen.getByLabelText('Opis prometa')).toHaveValue(
        VALID_ENTRY.opisPrometa,
      );
    });
  });

  it('shows ⇄ buttons by default', async () => {
    await renderForm();

    const convertButtons = screen.getAllByRole('button', {
      name: 'Konvertuj valutu',
    });
    expect(convertButtons).toHaveLength(2);
  });

  it('shows toast error when ⇄ clicked without a date selected', async () => {
    const user = userEvent.setup();
    await renderForm();

    const [convertBtn] = screen.getAllByRole('button', {
      name: 'Konvertuj valutu',
    });
    await user.click(convertBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Unesite ispravan datum pre konverzije/),
      ).toBeInTheDocument();
    });
  });

  it('opens converter modal when ⇄ clicked after a valid date is set', async () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: MOCK_RATE,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useExchangeRate>);
    vi.mocked(useCurrencies).mockReturnValue({
      data: [{ code: 'EUR', country: 'EMU of European Union' }],
      isPending: false,
      isError: false,
    } as ReturnType<typeof useCurrencies>);

    const user = userEvent.setup();
    await renderForm();

    await fillDate(user, VALID_ENTRY.datumPrometa);

    const [convertBtn] = screen.getAllByRole('button', {
      name: 'Konvertuj valutu',
    });
    await user.click(convertBtn);

    await screen.findByText('Konverzija valute');
  });

  describe('description suggestions', () => {
    it('wires the description input to a rendered datalist', async () => {
      await renderForm();
      expect(getDescriptionDatalist()).toBeInTheDocument();
    });

    it('renders no options while the field is empty', async () => {
      seedEntries([VALID_ENTRY]);
      await renderForm();

      expect(datalistValues()).toEqual([]);
    });

    it('offers matching prior descriptions once the user types', async () => {
      const user = userEvent.setup();
      seedEntries([
        suggestionEntry(1, 'Konsultacije'),
        suggestionEntry(2, 'Izrada sajta'),
      ]);
      await renderForm();

      await user.type(screen.getByLabelText('Opis prometa'), 'kons');

      await waitFor(() => expect(datalistValues()).toEqual(['Konsultacije']));
    });

    it('matches mid-string and caps the options at five', async () => {
      const user = userEvent.setup();
      seedEntries(
        Array.from({ length: 7 }, (_, i) =>
          suggestionEntry(i, `Usluga ${i + 1} mesecno`),
        ),
      );
      await renderForm();

      await user.type(screen.getByLabelText('Opis prometa'), 'mesecno');

      await waitFor(() => expect(datalistValues()).toHaveLength(5));
      for (const value of datalistValues()) {
        expect(value).toContain('mesecno');
      }
    });
  });

  it('applying converter fills the target field and closes the modal', async () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: MOCK_RATE,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useExchangeRate>);
    vi.mocked(useCurrencies).mockReturnValue({
      data: [{ code: 'EUR', country: 'EMU of European Union' }],
      isPending: false,
      isError: false,
    } as ReturnType<typeof useCurrencies>);

    const user = userEvent.setup();
    const { onSuccess } = await renderForm();

    await fillDate(user, VALID_ENTRY.datumPrometa);

    // Open converter for "Od prodaje proizvoda"
    const [convertBtn] = screen.getAllByRole('button', {
      name: 'Konvertuj valutu',
    });
    await user.click(convertBtn);

    await screen.findByText('Konverzija valute');

    const amountInput = screen.getByRole('textbox', {
      name: /Iznos u stranoj valuti/i,
    });
    await user.click(amountInput);
    await user.type(amountInput, '100');

    await user.click(screen.getByRole('button', { name: 'Primeni' }));

    await waitFor(() =>
      expect(screen.queryByText('Konverzija valute')).not.toBeInTheDocument(),
    );

    // Submit form to verify the field received the converted value
    await user.type(
      screen.getByLabelText('Opis prometa'),
      VALID_ENTRY.opisPrometa,
    );
    await user.type(screen.getByLabelText('Od izvršenih usluga'), '0');
    await user.click(screen.getByRole('button', { name: 'Potvrdi' }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          // 100 EUR × 117 RSD (parity 1) = 11700
          odProdajeProizvoda: 11700,
        }),
      );
    });
  });
});

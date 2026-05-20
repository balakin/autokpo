import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'tests/render-helpers';
import { describe, expect, it, vi } from 'vitest';

import { CurrencyConvertModal } from '../currency-convert-modal';
import { useCurrencies, useExchangeRate } from '../use-exchange-rates';

vi.mock('../use-exchange-rates', () => ({
  useCurrencies: vi.fn(),
  useExchangeRate: vi.fn(),
}));

const MOCK_CURRENCIES = [
  { code: 'EUR', country: 'EMU of European Union' },
  { code: 'USD', country: 'United States of America' },
];

const MOCK_RATE = {
  exchange_middle: 118.0,
  parity: 1,
  date: '2026-01-15',
  date_from: '2026-01-15',
};

function setupMocks({
  currenciesLoading = false,
  rateLoading = false,
  rateError = false,
  ratePending = false,
} = {}) {
  vi.mocked(useCurrencies).mockReturnValue({
    data: currenciesLoading ? undefined : MOCK_CURRENCIES,
    isPending: currenciesLoading,
    isError: false,
  } as ReturnType<typeof useCurrencies>);

  vi.mocked(useExchangeRate).mockReturnValue({
    data: rateLoading || rateError ? undefined : MOCK_RATE,
    isPending: rateLoading || ratePending,
    isError: rateError,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useExchangeRate>);
}

interface RenderProps {
  isOpen?: boolean;
  onClose?: () => void;
  onApply?: (v: string) => void;
}

async function renderModal({
  isOpen = true,
  onClose = vi.fn(),
  onApply = vi.fn(),
}: RenderProps = {}) {
  await renderWithProviders(
    <CurrencyConvertModal
      isOpen={isOpen}
      onClose={onClose}
      onApply={onApply}
      datumPrometa="2026-01-15"
      fieldLabel="Od prodaje proizvoda"
    />,
  );
  return { onClose, onApply };
}

describe('CurrencyConvertModal', () => {
  it('opens with EUR selected by default', async () => {
    setupMocks();
    await renderModal();

    expect(screen.getByText('Konverzija valute')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows skeleton while rate is loading', async () => {
    setupMocks({ rateLoading: true });
    await renderModal();

    // Rate display area shows skeleton when loading; Skeleton renders a div
    const rateArea = screen.getByRole('dialog');
    expect(rateArea).toBeInTheDocument();
    // The Primeni button is in pending state when rate loading
    expect(screen.getByRole('button', { name: 'Primeni' })).toBeInTheDocument();
  });

  it('displays rate and preview when rate is loaded', async () => {
    setupMocks();
    await renderModal();

    expect(screen.getByText(/1 EUR.*118/)).toBeInTheDocument();
  });

  it('shows inline error on rate fetch failure', async () => {
    setupMocks({ rateError: true });
    await renderModal();

    const dialogs = screen.getAllByRole('dialog');
    const dialog = dialogs[dialogs.length - 1];
    expect(dialog).toHaveTextContent(/Greška pri učitavanju kursa/);
  });

  it('Otkaži closes modal without changes', async () => {
    setupMocks();
    const user = userEvent.setup();
    const { onClose, onApply } = await renderModal();

    await user.click(screen.getByRole('button', { name: 'Otkaži' }));

    expect(onClose).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('Primeni applies computed RSD value and closes', async () => {
    setupMocks();
    const user = userEvent.setup();
    const { onApply, onClose } = await renderModal();

    const amountInput = screen.getByRole('textbox', {
      name: /Iznos u stranoj valuti/i,
    });
    await user.click(amountInput);
    await user.type(amountInput, '100');

    await user.click(screen.getByRole('button', { name: 'Primeni' }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith('11800');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('computes correct RSD value with parity > 1', async () => {
    vi.mocked(useExchangeRate).mockReturnValue({
      data: {
        exchange_middle: 74.0,
        parity: 100,
        date: '2026-01-15',
        date_from: '2026-01-15',
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useExchangeRate>);
    vi.mocked(useCurrencies).mockReturnValue({
      data: MOCK_CURRENCIES,
      isPending: false,
      isError: false,
    } as ReturnType<typeof useCurrencies>);

    const user = userEvent.setup();
    const { onApply } = await renderModal();

    const amountInput = screen.getByRole('textbox', {
      name: /Iznos u stranoj valuti/i,
    });
    await user.click(amountInput);
    await user.type(amountInput, '5000');

    await user.click(screen.getByRole('button', { name: 'Primeni' }));

    await waitFor(() => {
      // convertToRsd(5000, 74, 100) = Math.round(5000 * 74 / 100) = 3700
      expect(onApply).toHaveBeenCalledWith('3700');
    });
  });

  it('parses decimal comma input correctly', async () => {
    setupMocks();
    const user = userEvent.setup();
    const { onApply } = await renderModal();

    const amountInput = screen.getByRole('textbox', {
      name: /Iznos u stranoj valuti/i,
    });
    await user.click(amountInput);
    // CurrencyInput (decimalSeparator=",") interprets "50,50" as 50.5
    await user.type(amountInput, '50,50');

    await user.click(screen.getByRole('button', { name: 'Primeni' }));

    await waitFor(() => {
      // convertToRsd(50.5, 118, 1) = Math.round(50.5 * 118) = 5959
      expect(onApply).toHaveBeenCalledWith('5959');
    });
  });

  it('Primeni waits and applies when rate resolves during pending state', async () => {
    const refetch = vi.fn().mockResolvedValue({ data: MOCK_RATE });
    vi.mocked(useCurrencies).mockReturnValue({
      data: MOCK_CURRENCIES,
      isPending: false,
      isError: false,
    } as ReturnType<typeof useCurrencies>);
    vi.mocked(useExchangeRate).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch,
    } as unknown as ReturnType<typeof useExchangeRate>);

    const user = userEvent.setup();
    const { onApply } = await renderModal();

    const amountInput = screen.getByRole('textbox', {
      name: /Iznos u stranoj valuti/i,
    });
    await user.click(amountInput);
    await user.type(amountInput, '50');

    const applyButton = screen.getByRole('button', { name: 'Primeni' });
    await user.click(applyButton);

    await waitFor(() => {
      expect(refetch).toHaveBeenCalled();
      expect(onApply).toHaveBeenCalledWith('5900');
    });
  });
});

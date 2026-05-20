import { CalendarDate } from '@internationalized/date';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';

import { belgradeToday } from '../../belgrade-date';
import { fetchCurrencies, fetchRate } from '../exchange-rates-api';
import { useCurrencies, useExchangeRate } from '../use-exchange-rates';

vi.mock('../exchange-rates-api');
vi.mock('../../belgrade-date');

afterEach(() => {
  vi.clearAllMocks();
});

const MOCK_CURRENCIES = [{ code: 'EUR', country: 'EU' }];
const MOCK_RATE = {
  exchange_middle: 118.0,
  parity: 1,
  date: '2025-01-10',
  date_from: '2025-01-10',
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useCurrencies', () => {
  it('fetches and returns currencies on mount', async () => {
    vi.mocked(fetchCurrencies).mockResolvedValue(MOCK_CURRENCIES);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useCurrencies(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_CURRENCIES);
    expect(fetchCurrencies).toHaveBeenCalledTimes(1);
  });
});

describe('useExchangeRate', () => {
  it('fetches rate with the given currency and date', async () => {
    vi.mocked(belgradeToday).mockReturnValue(new CalendarDate(2025, 4, 25));
    vi.mocked(fetchRate).mockResolvedValue(MOCK_RATE);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useExchangeRate('EUR', '2025-01-10'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_RATE);
    expect(fetchRate).toHaveBeenCalledWith('EUR', '2025-01-10');
  });

  it('stays pending and does not fetch when currency is empty', async () => {
    vi.mocked(belgradeToday).mockReturnValue(new CalendarDate(2025, 4, 25));
    vi.mocked(fetchRate).mockResolvedValue(MOCK_RATE);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useExchangeRate('', '2025-01-10'), {
      wrapper,
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.isPending).toBe(true);
    expect(fetchRate).not.toHaveBeenCalled();
  });

  it('stays pending and does not fetch when date is empty', async () => {
    vi.mocked(belgradeToday).mockReturnValue(new CalendarDate(2025, 4, 25));
    vi.mocked(fetchRate).mockResolvedValue(MOCK_RATE);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useExchangeRate('EUR', ''), {
      wrapper,
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.isPending).toBe(true);
    expect(fetchRate).not.toHaveBeenCalled();
  });

  it('uses 1-hour staleTime when date is today', async () => {
    const TODAY = '2025-04-25';
    vi.mocked(belgradeToday).mockReturnValue(new CalendarDate(2025, 4, 25));
    vi.mocked(fetchRate).mockResolvedValue({
      ...MOCK_RATE,
      date: TODAY,
      date_from: TODAY,
    });
    const { queryClient, wrapper } = makeWrapper();

    const { result } = renderHook(() => useExchangeRate('EUR', TODAY), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ['exchange-rates', 'rate', 'EUR', TODAY] });
    expect((query?.options as Record<string, unknown>).staleTime).toBe(
      60 * 60 * 1000,
    );
  });

  it('uses Infinity staleTime for past dates', async () => {
    vi.mocked(belgradeToday).mockReturnValue(new CalendarDate(2025, 4, 25));
    vi.mocked(fetchRate).mockResolvedValue(MOCK_RATE);
    const { queryClient, wrapper } = makeWrapper();

    const { result } = renderHook(() => useExchangeRate('EUR', '2025-01-10'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ['exchange-rates', 'rate', 'EUR', '2025-01-10'] });
    expect((query?.options as Record<string, unknown>).staleTime).toBe(
      Infinity,
    );
  });
});

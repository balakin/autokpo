import { useQuery } from '@tanstack/react-query';

import { belgradeToday } from '../belgrade-date';

import { fetchCurrencies, fetchRate } from './exchange-rates-api';

export function useCurrencies() {
  return useQuery({
    queryKey: ['exchange-rates', 'currencies'],
    queryFn: fetchCurrencies,
    staleTime: Infinity,
  });
}

export function useExchangeRate(currency: string, date: string) {
  const isToday = date === belgradeToday().toString();
  return useQuery({
    queryKey: ['exchange-rates', 'rate', currency, date],
    queryFn: () => fetchRate(currency, date),
    staleTime: isToday ? 60 * 60 * 1000 : Infinity,
    enabled: !!currency && !!date,
  });
}

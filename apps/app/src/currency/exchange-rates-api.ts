export interface Currency {
  code: string;
  country: string;
}

export interface ExchangeRate {
  exchange_middle: number;
  parity: number;
  date: string;
  date_from: string;
}

export async function fetchCurrencies(): Promise<Currency[]> {
  const res = await fetch('/api/exchange-rates/currencies');
  if (!res.ok) throw new Error(`Failed to fetch currencies: ${res.status}`);
  const data = (await res.json()) as { currencies: Currency[] };
  return data.currencies;
}

export async function fetchRate(
  currency: string,
  date: string,
): Promise<ExchangeRate> {
  const res = await fetch(
    `/api/exchange-rates/rate?currency=${encodeURIComponent(currency)}&date=${encodeURIComponent(date)}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch rate: ${res.status}`);
  return (await res.json()) as ExchangeRate;
}

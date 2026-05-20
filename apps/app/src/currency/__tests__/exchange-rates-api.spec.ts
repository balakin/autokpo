import { describe, expect, it, vi, afterEach } from 'vitest';

import { fetchCurrencies, fetchRate } from '../exchange-rates-api';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchCurrencies', () => {
  it('returns parsed currency list on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ currencies: [{ code: 'EUR', country: 'EU' }] }),
            { status: 200 },
          ),
        ),
    );

    const result = await fetchCurrencies();
    expect(result).toEqual([{ code: 'EUR', country: 'EU' }]);
    expect(fetch).toHaveBeenCalledWith('/api/exchange-rates/currencies');
  });

  it('throws on non-200 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 500 })),
    );

    await expect(fetchCurrencies()).rejects.toThrow(
      'Failed to fetch currencies: 500',
    );
  });
});

describe('fetchRate', () => {
  it('returns rate data on success', async () => {
    const rateData = {
      exchange_middle: 118.0,
      parity: 1,
      date: '2026-01-15',
      date_from: '2026-01-15',
    };
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(rateData), { status: 200 }),
        ),
    );

    const result = await fetchRate('EUR', '2026-01-15');
    expect(result).toEqual(rateData);
    expect(fetch).toHaveBeenCalledWith(
      '/api/exchange-rates/rate?currency=EUR&date=2026-01-15',
    );
  });

  it('throws on non-200 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 404 })),
    );

    await expect(fetchRate('XYZ', '2026-01-15')).rejects.toThrow(
      'Failed to fetch rate: 404',
    );
  });

  it('URL-encodes currency and date params', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            exchange_middle: 1,
            parity: 1,
            date: 'd',
            date_from: 'd',
          }),
          { status: 200 },
        ),
      ),
    );

    await fetchRate('EUR', '2026-01-15');
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('currency=EUR');
    expect(url).toContain('date=2026-01-15');
  });
});

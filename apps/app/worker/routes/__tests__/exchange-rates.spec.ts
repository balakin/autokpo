import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearAuthData,
  workerTestEnv,
} from '../../../tests/worker/auth-helpers';
import {
  makeAuthHeaders,
  mergeHeaders,
  mockCtx,
  type SessionState,
} from '../../../tests/worker/request-helpers';
import app from '../../app/app';

const sessionState: SessionState = { userId: 'user-1', headers: null };
const authHeaders = makeAuthHeaders(sessionState);

async function req(url: string, init?: RequestInit) {
  return app.request(
    url,
    {
      ...init,
      headers: mergeHeaders(init?.headers, await authHeaders()),
    },
    workerTestEnv,
    mockCtx,
  );
}

const mockCurrenciesResponse = {
  currencies: [
    {
      code: 'EUR',
      number: 978,
      country: 'EMU of European Union',
      since: '2002-05-15',
      until: '2026-12-30',
    },
    {
      code: 'USD',
      number: 840,
      country: 'United States of America',
      since: '2002-05-15',
      until: '2026-12-30',
    },
  ],
};

const mockRateResponse = {
  code: 'EUR',
  date: '2026-01-15',
  date_from: '2026-01-15',
  number: 253,
  parity: 1,
  cash_buy: 117.0,
  cash_sell: 119.0,
  exchange_buy: 117.5,
  exchange_middle: 118.0,
  exchange_sell: 118.5,
};

beforeEach(async () => {
  sessionState.userId = 'user-1';
  sessionState.headers = null;
  await clearAuthData();
  vi.stubGlobal('caches', {
    default: {
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    },
  });
});

describe('GET /api/exchange-rates/currencies', () => {
  it('returns 401 when request is unauthenticated', async () => {
    sessionState.userId = null;
    const res = await req('/api/exchange-rates/currencies');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ code: 'unauthorized' });
  });

  it('returns 200 with currency list', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(mockCurrenciesResponse), { status: 200 }),
        ),
    );

    const res = await req('/api/exchange-rates/currencies');
    expect(res.status).toBe(200);
    const body = await res.json<{
      currencies: { code: string; country: string }[];
    }>();
    expect(body.currencies).toHaveLength(2);
    expect(body.currencies[0]).toEqual({
      code: 'EUR',
      country: 'EMU of European Union',
    });
    expect(body.currencies[0]).not.toHaveProperty('number');
  });

  it('sets Cache-Control on the response', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(mockCurrenciesResponse), { status: 200 }),
        ),
    );

    const res = await req('/api/exchange-rates/currencies');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
  });

  it('serves from cache when available', async () => {
    const cachedResponse = new Response(
      JSON.stringify({ currencies: [{ code: 'EUR', country: 'EU' }] }),
      { status: 200 },
    );
    vi.stubGlobal('caches', {
      default: {
        match: vi.fn().mockResolvedValue(cachedResponse),
        put: vi.fn(),
      },
    });
    vi.stubGlobal('fetch', vi.fn());

    const res = await req('/api/exchange-rates/currencies');
    expect(res.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 502 when upstream fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('Internal Server Error', { status: 500 }),
        ),
    );

    const res = await req('/api/exchange-rates/currencies');
    expect(res.status).toBe(502);
  });
});

describe('GET /api/exchange-rates/rate', () => {
  it('returns 200 with correct fields for a past date', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(mockRateResponse), { status: 200 }),
        ),
    );

    const res = await req(
      '/api/exchange-rates/rate?currency=EUR&date=2026-01-15',
    );
    expect(res.status).toBe(200);
    const body = await res.json<{
      exchange_middle: number;
      parity: number;
      date: string;
      date_from: string;
    }>();
    expect(body).toMatchObject({
      exchange_middle: 118.0,
      parity: 1,
      date: '2026-01-15',
      date_from: '2026-01-15',
    });
    expect(body).not.toHaveProperty('cash_buy');
  });

  it('sets long cache for past date', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(mockRateResponse), { status: 200 }),
        ),
    );

    const res = await req(
      '/api/exchange-rates/rate?currency=EUR&date=2026-01-15',
    );
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000');
  });

  it('sets short cache for current or future date', async () => {
    const futureDate = '2099-12-31';
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ ...mockRateResponse, date: futureDate }),
            { status: 200 },
          ),
        ),
    );

    const res = await req(
      `/api/exchange-rates/rate?currency=EUR&date=${futureDate}`,
    );
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('normalizes currency code to uppercase', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(mockRateResponse), { status: 200 }),
        ),
    );

    await req('/api/exchange-rates/rate?currency=eur&date=2026-01-15');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/EUR/'));
  });

  it('returns 400 when currency is missing', async () => {
    const res = await req('/api/exchange-rates/rate?date=2026-01-15');
    expect(res.status).toBe(400);
  });

  it('returns 400 when date is missing', async () => {
    const res = await req('/api/exchange-rates/rate?currency=EUR');
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid currency format', async () => {
    const res = await req(
      '/api/exchange-rates/rate?currency=../etc&date=2026-01-15',
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid date format', async () => {
    const res = await req(
      '/api/exchange-rates/rate?currency=EUR&date=not-a-date',
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown currency', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ code: 404, message: 'Currency Not Found' }),
            { status: 404 },
          ),
        ),
    );

    const res = await req(
      '/api/exchange-rates/rate?currency=XYZ&date=2026-01-15',
    );
    expect(res.status).toBe(404);
  });

  it('returns 502 when upstream fails with 5xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('Service Unavailable', { status: 503 }),
        ),
    );

    const res = await req(
      '/api/exchange-rates/rate?currency=EUR&date=2026-01-15',
    );
    expect(res.status).toBe(502);
  });
});

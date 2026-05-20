import { Hono } from 'hono';

import { requireSession } from '../auth';

const KURS_BASE = 'https://kurs.resenje.org/api/v1';

const CURRENCY_RE = /^[A-Za-z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function belgradeDateToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Belgrade',
  }).format(new Date());
}

function upstreamStatus(status: number): 404 | 502 {
  return status === 404 ? 404 : 502;
}

const router = new Hono<{ Bindings: Env }>();

router.get('/exchange-rates/currencies', async (c) => {
  const auth = await requireSession(c);
  if (auth instanceof Response) return auth;

  const cacheKey = new Request('https://cache.local/exchange-rates/currencies');
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(`${KURS_BASE}/currencies`);
  if (!upstream.ok) {
    return c.json({ error: 'Upstream error' }, upstreamStatus(upstream.status));
  }

  const data = await upstream.json<{
    currencies: {
      code: string;
      number: number;
      country: string;
      since: string;
      until: string;
    }[];
  }>();
  const currencies = data.currencies.map(({ code, country }) => ({
    code,
    country,
  }));

  const response = c.json({ currencies });
  response.headers.set('Cache-Control', 'public, max-age=86400');
  c.executionCtx.waitUntil(caches.default.put(cacheKey, response.clone()));

  return response;
});

router.get('/exchange-rates/rate', async (c) => {
  const auth = await requireSession(c);
  if (auth instanceof Response) return auth;

  const currency = c.req.query('currency');
  const date = c.req.query('date');

  if (!currency || !date) {
    return c.json(
      { error: 'Missing required query parameters: currency, date' },
      400,
    );
  }
  if (!CURRENCY_RE.test(currency)) {
    return c.json({ error: 'Invalid currency code' }, 400);
  }
  if (!DATE_RE.test(date)) {
    return c.json({ error: 'Invalid date format, expected YYYY-MM-DD' }, 400);
  }

  const code = currency.toUpperCase();

  const cacheKey = new Request(
    `https://cache.local/exchange-rates/rate/${code}/${date}`,
  );
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(`${KURS_BASE}/currencies/${code}/rates/${date}`);
  if (!upstream.ok) {
    return c.json({ error: 'Upstream error' }, upstreamStatus(upstream.status));
  }

  const data = await upstream.json<{
    exchange_middle: number;
    parity: number;
    date: string;
    date_from: string;
  }>();

  const { exchange_middle, parity, date: rateDate, date_from } = data;

  // YYYY-MM-DD strings sort lexicographically, so string comparison is correct here.
  const today = belgradeDateToday();
  const maxAge = date < today ? 31_536_000 : 3600;

  const response = c.json({
    exchange_middle,
    parity,
    date: rateDate,
    date_from,
  });
  response.headers.set('Cache-Control', `public, max-age=${maxAge}`);
  c.executionCtx.waitUntil(caches.default.put(cacheKey, response.clone()));

  return response;
});

export { router as exchangeRatesRouter };

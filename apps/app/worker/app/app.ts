import { Hono } from 'hono';

import { authHandler } from '../auth/auth';
import { MAX_AUTH_BODY_BYTES } from '../constants';
import type { WorkerHonoEnv } from '../context';
import { csrfMiddleware } from '../middlewares/csrf';
import { payloadLimit } from '../middlewares/payload-limit';
import { authRateLimiter } from '../middlewares/rate-limit';
import { e2eeRouter } from '../routes/e2ee';
import { exchangeRatesRouter } from '../routes/exchange-rates';
import { syncRouter } from '../routes/sync';

const app = new Hono<WorkerHonoEnv>();

app.use('*', csrfMiddleware());

app.on(
  ['GET', 'POST'],
  '/api/auth/*',
  authRateLimiter(),
  payloadLimit(MAX_AUTH_BODY_BYTES),
  (c) => authHandler(c.req.raw, c.env, c.executionCtx),
);

app.route('/api/e2ee', e2eeRouter);
app.route('/api/exchange-rates', exchangeRatesRouter);
app.route('/api/sync', syncRouter);

export default app;

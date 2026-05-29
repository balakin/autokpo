import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';

import { authHandler } from './auth';
import { csrfMiddleware } from './csrf';
import { MAX_E2EE_BODY_BYTES, MAX_SYNC_BODY_BYTES } from './payload-limits';
import { e2eeRouter } from './routes/e2ee';
import { exchangeRatesRouter } from './routes/exchange-rates';
import { syncRouter } from './routes/sync';

const app = new Hono<{ Bindings: Env }>();

app.use('*', csrfMiddleware());

app.on(['GET', 'POST'], '/api/auth/*', (c) =>
  authHandler(c.req.raw, c.env, c.executionCtx),
);

const payloadTooLarge = () =>
  Response.json({ code: 'payload_too_large' }, { status: 413 });

app.use(
  '/api/e2ee/*',
  bodyLimit({ maxSize: MAX_E2EE_BODY_BYTES, onError: payloadTooLarge }),
);
app.use(
  '/api/sync',
  bodyLimit({ maxSize: MAX_SYNC_BODY_BYTES, onError: payloadTooLarge }),
);
app.use(
  '/api/sync/*',
  bodyLimit({ maxSize: MAX_SYNC_BODY_BYTES, onError: payloadTooLarge }),
);

app.route('/api/e2ee', e2eeRouter);
app.route('/api', exchangeRatesRouter);
app.route('/api/sync', syncRouter);

export default app;

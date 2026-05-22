import { Hono } from 'hono';

import { authHandler } from './auth';
import { csrfMiddleware } from './csrf';
import { avatarsRouter } from './routes/avatars';
import { e2eeRouter } from './routes/e2ee';
import { exchangeRatesRouter } from './routes/exchange-rates';
import { syncRouter } from './routes/sync';

const app = new Hono<{ Bindings: Env }>();

app.use('*', csrfMiddleware());

app.on(['GET', 'POST'], '/api/auth/*', (c) =>
  authHandler(c.req.raw, c.env, c.executionCtx),
);

app.route('/', avatarsRouter);
app.route('/api/e2ee', e2eeRouter);
app.route('/api', exchangeRatesRouter);
app.route('/api/sync', syncRouter);

export default app;

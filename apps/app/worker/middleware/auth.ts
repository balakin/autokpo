import type { MiddlewareHandler } from 'hono';

import { requireSession } from '../auth';
import type { WorkerHonoEnv } from '../context';

export const requireAuth: MiddlewareHandler<WorkerHonoEnv> = async (
  c,
  next,
) => {
  const session = await requireSession(c);
  if (session instanceof Response) return session;

  c.set('session', session);
  await next();
};

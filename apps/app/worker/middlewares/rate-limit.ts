import type { MiddlewareHandler } from 'hono';
import { getConnInfo } from 'hono/cloudflare-workers';

import type { WorkerHonoEnv } from '../context';

type RateLimitRouteGroup = 'sync' | 'e2ee' | 'exchange-rates';

const RATE_LIMIT_BINDINGS = {
  sync: 'SYNC_RATE_LIMITER',
  e2ee: 'E2EE_RATE_LIMITER',
  'exchange-rates': 'EXCHANGE_RATES_RATE_LIMITER',
} as const satisfies Record<RateLimitRouteGroup, keyof Env>;

export function rateLimitRouteGroup(
  routeGroup: RateLimitRouteGroup,
): MiddlewareHandler<WorkerHonoEnv> {
  return async (c, next) => {
    const session = c.get('session');
    const binding = c.env[RATE_LIMIT_BINDINGS[routeGroup]];

    const outcome = await binding.limit({
      key: `user:${session.user.id}:${routeGroup}`,
    });

    if (!outcome.success) {
      return c.json({ code: 'rate_limited' }, 429);
    }

    await next();
  };
}

export function authRateLimiter(): MiddlewareHandler<WorkerHonoEnv> {
  return async (c, next) => {
    const ip = getConnInfo(c).remote.address ?? 'unknown';
    const path = new URL(c.req.url).pathname;

    const outcome = await c.env.AUTH_RATE_LIMITER.limit({
      key: `auth:${ip}:${path}`,
    });

    if (!outcome.success) {
      return c.json({ code: 'rate_limited' }, 429);
    }

    await next();
  };
}

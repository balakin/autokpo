import type { MiddlewareHandler } from 'hono';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    if (SAFE_METHODS.has(c.req.method)) return next();

    const hasCookies = !!c.req.header('Cookie');
    if (!hasCookies) return next();

    const origin = c.req.header('Origin') ?? c.req.header('Referer') ?? '';
    if (!origin || origin === 'null') {
      return Response.json({ code: 'missing_origin' }, { status: 403 });
    }

    const trustedOrigin = new URL(c.env.APP_URL).origin;
    if (!origin.startsWith(trustedOrigin)) {
      return Response.json({ code: 'invalid_origin' }, { status: 403 });
    }

    return next();
  };
}

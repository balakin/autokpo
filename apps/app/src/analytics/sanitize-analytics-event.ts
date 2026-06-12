import type { BeforeSendFn } from 'posthog-js';
import { matchRoutes } from 'react-router';

import { appRoutes } from '../router/app-routes';

// We sanitize by *value* rather than by an allowlist of PostHog property names
// ($current_url, $pathname, …). Those names are PostHog's schema and could be
// renamed or extended; matching URL-like values keeps this fail-safe — a new or
// renamed URL field is still scrubbed instead of silently leaking route ids.
/**
 * Replace each matched route param value with its `:name`, so dynamic ids
 * (e.g. `/books/2024-abc` → `/books/:bookId`) never reach PostHog. Route-aware
 * via `matchRoutes`, so any future `:param` route is masked automatically with
 * no change here. The catch-all splat (`*`) is left as-is — it isn't a route
 * id, and masking it would mangle unmatched / external referrer paths.
 */
function maskPathname(pathname: string): string {
  const params = matchRoutes(appRoutes, pathname)?.at(-1)?.params ?? {};
  let masked = pathname;
  for (const [name, value] of Object.entries(params)) {
    if (value && name !== '*') {
      masked = masked.replaceAll(value, `:${name}`);
    }
  }
  return masked;
}

/**
 * Sanitize a property value if it's URL-like, parsing it exactly once.
 * Returns the scrubbed value, or `null` to mean "not a URL, leave untouched".
 */
function sanitizeUrlValue(value: string): string | null {
  // Rooted path (e.g. `$pathname` → "/items/abc") — always same-origin and
  // ours to mask, but `new URL` can't parse it standalone (no scheme).
  if (value.startsWith('/')) {
    return maskPathname(value.replace(/[?#].*$/, ''));
  }
  // Otherwise it must parse as an absolute URL. Anything else — a bare host
  // ("app.autokpo.com"), "$direct", or a relative path ("path/to/x") — is
  // indistinguishable from plain text, so we leave it alone. (Resolving it
  // against our origin would rewrite non-URL values into URLs.)
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  // Our route patterns only mean something for our own origin — another
  // service's URL (a cross-origin referrer) isn't ours to rewrite, so leave
  // it untouched rather than coincidentally masking a lookalike path.
  if (url.origin !== window.location.origin) return value;
  url.search = '';
  url.hash = '';
  url.pathname = maskPathname(url.pathname);
  return url.toString();
}

/**
 * `before_send` hook: strips route ids and query/hash from every URL-like
 * property so pageviews can power active-user counts without leaking sensitive
 * in-app locations. Mutates and returns the event in place (PostHog's
 * documented pattern); `null` passes through to mean "drop the event".
 */
export const sanitizeAnalyticsEvent: BeforeSendFn = (event) => {
  if (!event) return event;
  const { properties } = event;
  for (const key of Object.keys(properties)) {
    const value: unknown = properties[key];
    if (typeof value !== 'string') continue;
    const sanitized = sanitizeUrlValue(value);
    if (sanitized !== null) properties[key] = sanitized;
  }
  return event;
};

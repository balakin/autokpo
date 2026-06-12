import type { CaptureResult } from 'posthog-js';
import type { RouteObject } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { sanitizeAnalyticsEvent } from '../sanitize-analytics-event';

// Mock the app's route config so this stays a true unit test: the sanitizer's
// behavior is verified against a fixed fixture, not whatever routes the app
// happens to have. Changing the real routes can't break these tests.
vi.mock('../../router/app-routes', () => {
  const appRoutes: RouteObject[] = [
    { path: '/dashboard' },
    { path: '/items/:itemId' }, // single dynamic param
    { path: '/auth/:provider/callback' }, // param in the middle of a path
    {
      path: '/section', // nested parent with *relative* children (no params)
      children: [{ path: 'general' }, { path: 'details' }],
    },
    { path: '*' }, // catch-all splat
  ];
  return { appRoutes };
});

// Our own origin under test (jsdom default). Route masking only applies here.
const ORIGIN = window.location.origin;

function event(properties: Record<string, unknown>): CaptureResult {
  return {
    uuid: 'test-uuid',
    event: '$pageview',
    properties: properties,
  };
}

describe('sanitizeAnalyticsEvent', () => {
  it('masks a route param in $current_url and drops query/hash', () => {
    const result = sanitizeAnalyticsEvent(
      event({ $current_url: `${ORIGIN}/items/2024-abc?token=secret#frag` }),
    );

    expect(result?.properties.$current_url).toBe(`${ORIGIN}/items/:itemId`);
  });

  it('masks a route param in a bare $pathname', () => {
    const result = sanitizeAnalyticsEvent(
      event({ $pathname: '/items/2024-abc' }),
    );

    expect(result?.properties.$pathname).toBe('/items/:itemId');
  });

  it('masks a mid-path param and drops the query', () => {
    const result = sanitizeAnalyticsEvent(
      event({ $pathname: '/auth/google/callback?error=access_denied' }),
    );

    expect(result?.properties.$pathname).toBe('/auth/:provider/callback');
  });

  it('leaves a nested + relative route without params untouched', () => {
    const result = sanitizeAnalyticsEvent(
      event({ $pathname: '/section/details' }),
    );

    // Relative children carry no params, so the path passes through unchanged.
    expect(result?.properties.$pathname).toBe('/section/details');
  });

  it('sanitizes same-origin $referrer and $prev_pageview_pathname too', () => {
    const result = sanitizeAnalyticsEvent(
      event({
        $referrer: `${ORIGIN}/items/xyz?q=1`,
        $prev_pageview_pathname: '/items/xyz',
      }),
    );

    expect(result?.properties.$referrer).toBe(`${ORIGIN}/items/:itemId`);
    expect(result?.properties.$prev_pageview_pathname).toBe('/items/:itemId');
  });

  it('leaves a cross-origin URL untouched, even if its path looks like ours', () => {
    const result = sanitizeAnalyticsEvent(
      event({ $referrer: 'https://other-service.com/items/123?ref=x' }),
    );

    // Another service's URL — our `/items/:itemId` pattern is meaningless there,
    // so it must be returned verbatim (no masking, no query stripping).
    expect(result?.properties.$referrer).toBe(
      'https://other-service.com/items/123?ref=x',
    );
  });

  it('strips query but keeps an unmatched same-origin path (splat not masked)', () => {
    const result = sanitizeAnalyticsEvent(
      event({ $current_url: `${ORIGIN}/totally/unknown?x=1` }),
    );

    expect(result?.properties.$current_url).toBe(`${ORIGIN}/totally/unknown`);
  });

  it('scrubs any same-origin url-like property regardless of name (rename-proof)', () => {
    const result = sanitizeAnalyticsEvent(
      event({
        // A hypothetical future / renamed PostHog URL field we never allowlisted.
        $some_future_url_field: `${ORIGIN}/items/abc?t=1`,
      }),
    );

    expect(result?.properties.$some_future_url_field).toBe(
      `${ORIGIN}/items/:itemId`,
    );
  });

  it('ignores string values that are not url-like (host, $direct referrer)', () => {
    const result = sanitizeAnalyticsEvent(
      event({ $host: 'app.autokpo.com', $referrer: '$direct' }),
    );

    expect(result?.properties.$host).toBe('app.autokpo.com');
    expect(result?.properties.$referrer).toBe('$direct');
  });

  it('leaves static routes unchanged', () => {
    const result = sanitizeAnalyticsEvent(
      event({ $current_url: `${ORIGIN}/dashboard` }),
    );

    expect(result?.properties.$current_url).toBe(`${ORIGIN}/dashboard`);
  });

  it('leaves non-string and unrelated properties untouched', () => {
    const result = sanitizeAnalyticsEvent(
      event({ $pathname: '/dashboard', distinct_id: 42, provider: 'google' }),
    );

    expect(result?.properties.$pathname).toBe('/dashboard');
    expect(result?.properties.distinct_id).toBe(42);
    expect(result?.properties.provider).toBe('google');
  });

  it('passes a null event through (drop signal)', () => {
    expect(sanitizeAnalyticsEvent(null)).toBeNull();
  });
});

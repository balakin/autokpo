import posthog from 'posthog-js';

import { sanitizeAnalyticsEvent } from './sanitize-analytics-event';

export { posthog };

/**
 * Initializes PostHog as privacy-first, anonymous analytics: cookieless, no
 * browser storage, never identified, with route ids stripped from URLs (see
 * {@link sanitizeAnalyticsEvent}). No-ops when the env vars are absent so local
 * dev / tests run without analytics.
 */
export function initAnalytics(): void {
  const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
  const host = import.meta.env.VITE_POSTHOG_HOST;
  if (!token || !host) return;

  posthog.init(token, {
    api_host: host, // first-party reverse proxy (CNAME → PostHog EU)
    ui_host: 'https://eu.posthog.com', // so toolbar / "view in app" links resolve to EU Cloud, not the proxy
    defaults: '2026-01-30',

    cookieless_mode: 'always', // no cookies / localStorage; hashed anonymous visitor id
    persistence: 'memory', // belt-and-suspenders: nothing written to the browser
    mask_personal_data_properties: true, // mask known PII query params (gclid, fbclid, campaign keys, …) in captured urls
    autocapture: false, // no automatic click/form tracking
    capture_pageview: true, // needed for active-user counts (unique users per day)
    capture_pageleave: true, // bounce / time-on-page
    capture_performance: { web_vitals: true }, // Core Web Vitals (loads PostHog's web-vitals chunk)
    before_send: sanitizeAnalyticsEvent, // strip route ids + query/hash from urls
    disable_session_recording: true, // no replay
    disable_surveys: true, // no surveys
    enable_heatmaps: false, // no mouse-move / click / scroll heatmaps
    person_profiles: 'identified_only', // never identified → events stay anonymous
    advanced_disable_flags: true, // we use no flags/experiments/remote config; skips the /flags request (web vitals stays, set client-side above)
  });
}

## Context

The `/api/auth/email-otp/send-verification-otp` endpoint is publicly accessible with no authentication or validation. Any request triggers a Resend API call and delivers an email — making it trivially exploitable for email bombing or burning Resend credits. The rest of the auth surface (OAuth callbacks, OTP verification) is either gated by provider-side protection or requires a valid prior OTP send.

Three complementary layers address this:

1. **Cloudflare Turnstile** — primary gate, stops automated/bot requests
2. **Disposable email blocklist** — prevents throwaway account creation
3. **better-auth rate limiting (D1)** — backup if Turnstile is unavailable or bypassed

## Goals / Non-Goals

**Goals:**

- Protect the OTP send endpoint against automated abuse and disposable email signups
- Fail closed: if captcha is misconfigured in prod, requests are rejected rather than allowed
- Dev works without any captcha secrets — no test keys, no feature flags
- Minimal operational surface: no new external services beyond Turnstile

**Non-Goals:**

- Protecting OAuth routes (Google/GitHub provide their own bot protection)
- Real-time disposable domain updates (static snapshot at build time is acceptable)
- Protecting OTP verification endpoint (requires a valid prior send; window + expiry make brute-force impractical)
- Country/IP blocking or advanced threat intelligence

## Decisions

### 1. better-auth `captcha` plugin over custom Hono middleware

better-auth ships a first-class `captcha` plugin that validates the `x-captcha-response` header against the provider's `/siteverify`. Using it keeps captcha logic out of the application layer and within the auth configuration.

Alternative considered: custom middleware in `worker/main.ts` that validates the token before the request reaches better-auth. Rejected: more code, no advantage given the plugin exists.

### 2. Cloudflare Turnstile as provider

Turnstile is GDPR-friendly (no tracking cookies, no advertising profile, no consent banner required), free tier is generous, and already operates at the Cloudflare edge — same infrastructure as the Workers runtime.

Alternative considered: Google reCAPTCHA v3. Rejected: sets persistent cross-site cookies, requires cookie consent banner for GDPR compliance.

### 3. Captcha always active — Cloudflare test keys as dev fallback

The `captcha` plugin is always included. When `TURNSTILE_SECRET_KEY` is absent, the plugin falls back to Cloudflare's published test secret key (`1x0000000000000000000000000000000AA`), which always passes validation. The client widget similarly falls back to the test site key (`1x00000000000000000000AA`) when `VITE_TURNSTILE_SITE_KEY` is not set.

```typescript
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

plugins: [
  captcha({
    provider: "cloudflare-turnstile",
    secretKey: env.TURNSTILE_SECRET_KEY ?? TURNSTILE_TEST_SECRET,
    endpoints: ["/email-otp/send-verification-otp"],
  }),
  emailOtpPlugin({ ... }),
]
```

This means the full captcha code path — plugin validation, header attachment, widget render — is exercised in dev, eliminating a whole class of "works in dev, broken in prod" surprises.

Alternative considered: conditional plugin inclusion (skip captcha when key absent). Rejected: the captcha code path is untested in dev, increasing the risk of integration issues on first deploy.

### 4. Disposable email blocklist as a static TypeScript `Set`

~9,900 domains from `disposable-email-domains/disposable-email-domains` (CC0, public domain) are embedded as a `Set<string>` in `worker/disposable-email-blocklist.ts`. The check runs synchronously in the `sendVerificationOTP` hook — zero latency, no external dependency, no runtime secrets.

Bundle size impact: ~130–150 KB for the string data. Well within Cloudflare Worker limits (1 MB default, 10 MB compressed).

Alternative considered: external API (Debounce, Abstract). Rejected: adds latency, cost, and an external dependency to a critical auth path. Alternative considered: `disposable-email-domains` npm package. Rejected: large bundle, Worker size constraints.

Accepted tradeoff: list is a build-time snapshot — new disposable domains added after the snapshot are not blocked until the list is manually updated.

### 5. Blocklist check in `sendVerificationOTP` hook

The check is placed inside the `sendVerificationOTP` callback in `auth-options.ts`. Throwing there prevents the email send without requiring a separate Hono middleware layer.

Alternative considered: Hono middleware before `/api/auth/*` (prevents the D1 verification record write too). Rejected: adds complexity, requires parsing the request body outside of better-auth, and the saved D1 write is negligible.

### 6. Rate limiting with D1 storage as backup layer

better-auth's built-in `rateLimit` config uses D1 as the backing store (`storage: "database"`), which is durable across Worker invocations. The custom rule targets only the OTP send path.

`memory` storage is not viable on Cloudflare Workers — each invocation may be a different isolate.

Rate limit values: conservative defaults to be tuned based on observed usage. A suggested starting point: `window: 300` (5 minutes), `max: 5` per IP. Final values to be confirmed during implementation.

## Risks / Trade-offs

- **Blocklist staleness** → Accepted. New disposable services won't be blocked until the list is manually refreshed. Mitigation: update the list when recurring abuse from a new domain is observed.
- **False positives on blocklist** → Some legitimate email providers may share domains with the list. Accepted tradeoff for this app's risk profile. Mitigation: allow users to contact support if blocked.
- **Turnstile outage** → Rate limit (D1) catches automated abuse if Turnstile is unavailable. The `captcha` plugin rejects requests when `/siteverify` is unreachable — rate limit is the fallback.
- **Bundle size** → ~150 KB added to the Worker bundle for the blocklist. Acceptable; well within limits.

## Migration Plan

1. Create `worker/disposable-email-blocklist.ts` (generated from the CC0 source list)
2. Update `worker/auth-options.ts`: add captcha plugin + rateLimit config + blocklist check
3. Update `worker/auth.ts`: thread `TURNSTILE_SECRET_KEY` from env bindings
4. Update `wrangler.jsonc`: add `TURNSTILE_SECRET_KEY` to required secrets, `VITE_TURNSTILE_SITE_KEY` to vars
5. Update client email form: add Turnstile widget, attach token to OTP send request
6. Add Turnstile widget dependency
7. Set secrets in Cloudflare dashboard before deploying to production

**D1 migration**: better-auth auto-creates the `rateLimit` table on first request — no manual `db:generate` / `db:migrate` needed.

**Rollback**: remove `captcha` plugin and `rateLimit` config from `auth-options.ts`. No data migration needed.

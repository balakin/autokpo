## Why

The email OTP send endpoint (`/api/auth/email-otp/send-verification-otp`) is publicly accessible with no protection — a single unauthenticated request burns a Resend credit and delivers an email to any address. Disposable/temporary email domains allow throwaway account creation. Adding a layered defense raises the floor without impacting legitimate users.

## What Changes

- **New**: Disposable email domain blocklist — a static TypeScript `Set` of ~9,900 domains (CC0-licensed, sourced from `disposable-email-domains/disposable-email-domains`), checked in the `sendVerificationOTP` hook before sending email
- **New**: Cloudflare Turnstile captcha on the OTP send endpoint — server-side via better-auth's `captcha` plugin, client-side widget on the email form; disabled in dev when `TURNSTILE_SECRET_KEY` is absent
- **New**: better-auth built-in rate limiting with D1 storage on the OTP send endpoint — backup layer in case Turnstile is unavailable or a token is bypassed; configurable window and max per IP

## Capabilities

### New Capabilities

- `auth-abuse-prevention`: Three-layer defense on the OTP send endpoint: disposable email blocklist, Turnstile captcha, and IP-based rate limiting

### Modified Capabilities

- `user-auth`: Auth flow now requires a valid Turnstile token on OTP send (client must include `x-captcha-response` header); emails to disposable domains are rejected

## Impact

- **`worker/auth-options.ts`**: Add blocklist check in `sendVerificationOTP` hook; add `captcha` plugin; add `rateLimit` config with D1 storage
- **`worker/auth.ts`**: Pass `TURNSTILE_SECRET_KEY` from env into auth options
- **`wrangler.jsonc`**: Add `TURNSTILE_SECRET_KEY` to required secrets; add `VITE_TURNSTILE_SITE_KEY` var
- **New file**: `worker/disposable-email-blocklist.ts` — CC0 domain `Set`
- **Client (`src/auth/email-form.tsx`)**: Integrate Turnstile widget; attach token to OTP send request headers
- **New dependency**: `@marsidev/react-turnstile` (or equivalent) for client widget
- **D1**: better-auth auto-creates `rateLimit` table — no manual migration needed

## 1. Disposable Email Blocklist

- [x] 1.1 Fetch the CC0 blocklist from `https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf` and generate `worker/disposable-email-blocklist.ts` as a `Set<string>` export
- [x] 1.2 Add blocklist domain check in `sendVerificationOTP` hook in `worker/auth-options.ts` — throw before calling `sendEmail` if the domain is blocked

## 2. Rate Limiting

- [x] 2.1 Add `rateLimit` config to the auth options returned by `getAuthOptions` in `worker/auth-options.ts`: `storage: "database"`, custom rule on `/email-otp/send-verification-otp` (window: 300s, max: 5 per IP)
- [x] 2.2 Verify better-auth auto-creates the `rateLimit` D1 table on first request (no manual migration needed — confirm by running tests or local dev)

## 3. Cloudflare Turnstile — Server

- [x] 3.1 Add `captcha` plugin import from `better-auth/plugins` in `worker/auth-options.ts`
- [x] 3.2 Add `TURNSTILE_SECRET_KEY` to the `AuthOptionsInput` type and thread it through `getAuthOptions`
- [x] 3.3 Add captcha plugin to `plugins` array — always active, falling back to Cloudflare test secret key (`1x0000000000000000000000000000000AA`) when `TURNSTILE_SECRET_KEY` is absent; target only `/email-otp/send-verification-otp`
- [x] 3.4 Add `TURNSTILE_SECRET_KEY` to `worker/auth.ts` env threading (pass from `c.env` into `getAuthOptions`)
- [x] 3.5 Add `TURNSTILE_SECRET_KEY` to required secrets in `wrangler.jsonc`
- [x] 3.6 Run `pnpm -s generate:worker-types` to regenerate wrangler types after `wrangler.jsonc` changes

## 4. Cloudflare Turnstile — Client

- [x] 4.1 Add `VITE_TURNSTILE_SITE_KEY` to `wrangler.jsonc` vars (omitted/empty for dev to use test site key, real key for prod)
- [x] 4.2 Install Turnstile React client library (e.g. `@marsidev/react-turnstile`) in `apps/app`
- [x] 4.3 Add Turnstile widget to `src/auth/email-form.tsx` — always rendered, using `import.meta.env.VITE_TURNSTILE_SITE_KEY` if set, otherwise Cloudflare test site key (`1x00000000000000000000AA`)
- [x] 4.4 Capture the Turnstile token on solve and attach it as `x-captcha-response` header in the `authClient.emailOtp.sendVerificationOtp` call in `src/auth/auth-session.ts`
- [x] 4.5 Handle Turnstile widget reset after a failed OTP send (widget token is single-use)

## 5. Testing & Verification

- [x] 5.1 Add unit tests for the blocklist check: blocked domain throws, legitimate domain passes
- [x] 5.2 Verify in local dev that OTP send works without captcha keys (captcha disabled code path)
- [x] 5.3 Run full test suite: `cd apps/app && pnpm -s test --reporter=verbose | tail -n 120`

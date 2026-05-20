## Why

The email OTP flow has misaligned limits: the 30s frontend resend cooldown allows up to 10 sends in the 300s rate-limit window, but the server caps at 5 — silently blocking users who follow the UI. Additionally, each resend currently generates a new OTP code, leaving multiple valid codes in flight when email delivery is delayed, and there are no attempt limits on OTP verification.

## What Changes

- Increase frontend resend cooldown from 30s to 60s (aligns one-send-per-window-slot with the server's 5-per-300s cap)
- Set `resendStrategy: "reuse"` on the emailOTP plugin so resends extend the existing OTP's expiry instead of issuing a new code
- Set `allowedAttempts: 5` to invalidate an OTP after 5 failed verification attempts
- Set `expiresIn: 300` explicitly (matches the current default but makes intent clear)
- Regenerate the auth schema and D1 migration after config changes

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `auth-abuse-prevention`: OTP resend now reuses the same code (no multiple valid codes in flight); verification is capped at 5 attempts; frontend cooldown is 60s; OTP expiry is explicit at 300s

## Impact

- `src/auth/email-otp-sign-in.tsx` — `RESEND_COOLDOWN_SECONDS` constant
- `worker/auth-options.ts` — `emailOtpPlugin` config
- `worker/db/schema/auth.ts` — regenerated via `auth:generate`
- New D1 migration generated via `db:generate`, applied via `db:migrate:local`

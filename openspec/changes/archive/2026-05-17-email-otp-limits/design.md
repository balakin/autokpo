## Context

The email OTP plugin is configured via `worker/auth-options.ts` using better-auth's `emailOTP` plugin. Three gaps exist:

1. **Misaligned limits** — the frontend allowed one resend every 30s, meaning up to 10 sends in a 300s window, while the server caps at 5. Users could be silently rate-limited while following the UI's instructions.
2. **Multiple valid codes** — with the default resend strategy, every resend generates a fresh OTP. If an email is delayed, the user ends up with several valid codes in flight simultaneously.
3. **No attempt cap** — OTP verification has no attempt limit, leaving a 6-digit code exposed to brute-force for its full 5-minute lifetime.

## Goals / Non-Goals

**Goals:**

- Align the frontend resend cooldown with the server rate limit (60s × 5 = 300s window exactly)
- Ensure only one valid OTP is ever in flight per email address at a time
- Cap brute-force attempts on OTP verification
- Make `expiresIn` explicit in config (was relying on the better-auth default of 300s)

**Non-Goals:**

- Changing the server-side rate limit rule itself (`window: 300, max: 5` stays)
- Changing OTP length or format
- Modifying Turnstile or disposable-email blocklist behavior

## Decisions

### 1. Frontend cooldown: 30s → 60s

With a 60s cooldown, a user can make exactly 5 sends in a 300s window (initial send at t=0, resends at t=60, 120, 180, 240). This matches the server's `max: 5` cap, so a user who follows the UI will never hit a silent rate-limit wall.

**Alternative considered:** Keep 30s and raise server max to 10. Rejected — more permissive server-side is worse for abuse prevention.

### 2. `resendStrategy: "reuse"`

When a resend is triggered, better-auth retrieves the existing OTP from the `verification` table, extends its expiry, and passes the same code back to `sendVerificationOTP`. The client re-sends that same code to the user. Only one valid code exists per email at any time.

The `verification` table stores OTPs in plain text in the `value` column (confirmed from schema), so the `"reuse"` strategy has no additional storage requirement.

**Alternative considered:** Keep default (`"new-otp"`). Rejected — leaves stale valid codes in flight when email delivery is slow.

### 3. `allowedAttempts: 5`

After 5 failed verification attempts the OTP is invalidated; the user must request a new one. Five attempts is enough for a human making typos but too low to brute-force a 6-digit code (10^6 possibilities).

### 4. `expiresIn: 300` (explicit)

The better-auth default is 300s. Making it explicit prevents a future library upgrade from silently changing behavior.

## Risks / Trade-offs

- **Schema migration required** — `resendStrategy: "reuse"` and `allowedAttempts` may add columns to the `verification` table. Run `auth:generate` → `db:generate` → `db:migrate:local` after config changes. Rollback: revert config and run a new migration.
- **Users must re-request OTP more often** — once 5 bad attempts are used, the user gets locked out of that code. Mitigated by the clear error UX already in place.
- **60s cooldown is longer** — slightly less responsive UX for users who don't receive email. Mitigated by the fact that email delivery rarely takes >60s.

## Migration Plan

1. Update `RESEND_COOLDOWN_SECONDS` in frontend
2. Update `emailOtpPlugin` config in `worker/auth-options.ts`
3. Run `pnpm -s auth:generate` to regenerate `worker/db/schema/auth.ts`
4. Run `pnpm -s db:generate` to create the D1 migration
5. Run `pnpm -s db:migrate:local` to apply locally
6. Run tests; deploy worker + migration to remote as normal

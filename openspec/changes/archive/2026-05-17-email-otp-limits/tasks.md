## 1. Frontend

- [x] 1.1 Change `RESEND_COOLDOWN_SECONDS` from 30 to 60 in `src/auth/email-otp-sign-in.tsx`
- [x] 1.2 Verify tests in `src/auth/__tests__/email-otp-sign-in.spec.tsx` still pass (update any hardcoded 30s expectations)

## 2. Worker config

- [x] 2.1 Add `resendStrategy: "reuse"` to `emailOtpPlugin` in `worker/auth-options.ts`
- [x] 2.2 Add `allowedAttempts: 5` to `emailOtpPlugin`
- [x] 2.3 Add `expiresIn: 300` to `emailOtpPlugin`

## 3. Schema & migration

- [x] 3.1 Run `pnpm -s auth:generate` to regenerate `worker/db/schema/auth.ts`
- [x] 3.2 Run `pnpm -s db:generate` to create the D1 migration
- [x] 3.3 Run `pnpm -s db:migrate:local` to apply the migration locally

## 4. Tests

- [x] 4.1 Run worker tests (`cd apps/app && pnpm -s test worker/__tests__/email-otp-auth.spec.ts --reporter=verbose`) and fix any failures
- [x] 4.2 Run full test suite and confirm no regressions (`cd apps/app && pnpm -s test --reporter=verbose | tail -n 120`)

## 1. Email Template

- [x] 1.1 Create `apps/app/emails/otp-email.tsx` — React Email component accepting an `otp: string` prop
- [x] 1.2 Style the template with AutoKPO branding (name, sign-in context, prominent OTP display, Serbian copy)
- [x] 1.3 Verify `react-email` preview works locally (`email dev` or equivalent)

## 2. Send Helper

- [x] 2.1 Add `resend` as a runtime dependency in `apps/app/package.json`
- [x] 2.2 Create `apps/app/worker/send-otp-email.tsx` — calls `resend.emails.send({ react: <OtpEmail /> })`

## 3. Worker Wiring

- [x] 3.1 Refactor `EmailOtpOptions` in `auth-options.ts` to accept `sendEmail: (to, otp) => Promise<void>` callback
- [x] 3.2 Update `auth.ts` to pass `sendOtpEmail(env.RESEND_API_KEY, env.RESEND_FROM_EMAIL, to, otp)` as the callback
- [x] 3.3 Update `auth.config.ts` stub to use `sendEmail: async () => {}`

## 4. Tests

- [x] 4.1 Update `tests/worker/auth-helpers.ts` to pass `sendEmail: vi.fn()` instead of raw credentials
- [x] 4.2 Update `email-otp-auth.spec.ts` fetch mock to handle `html` field in addition to `text`
- [x] 4.3 Run existing worker auth tests and confirm they pass

## 5. Verification

- [x] 5.1 Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to `apps/app/.dev.vars` if not already present
- [x] 5.2 Trigger a test sign-in and verify the branded HTML email arrives with the correct OTP

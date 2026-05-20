## Why

The OTP sign-in email was a plain-text string assembled inline in the worker. A branded HTML email improves first-impression trust. React Email makes it trivial to author a component-driven template that the Resend SDK renders server-side at send time — no build-time pipeline needed.

## What Changes

- New `apps/app/emails/otp-email.tsx` — React Email template with AutoKPO branding, authored alongside the app.
- New `apps/app/worker/send-otp-email.tsx` — thin wrapper that instantiates the Resend SDK and calls `resend.emails.send({ react: <OtpEmail /> })`.
- `auth-options.ts` refactored to accept a `sendEmail: (to, otp) => Promise<void>` callback instead of raw Resend credentials, keeping the auth options layer transport-agnostic.
- `auth.ts` wires the callback by calling `sendOtpEmail(env.RESEND_API_KEY, env.RESEND_FROM_EMAIL, to, otp)`.
- `resend` SDK added as a runtime dependency of `apps/app`.

## Capabilities

### New Capabilities

- `email-templates`: Branded HTML OTP email template (`apps/app/emails/otp-email.tsx`) authored with React Email components, rendered at request time by the Resend SDK.

### Modified Capabilities

- `user-auth`: OTP email delivery changes from an inline plain-text `fetch` to the Resend SDK rendering the React template. No behavioral change to the sign-in flow itself.

## Impact

- `apps/app/emails/otp-email.tsx`: new React Email template component.
- `apps/app/worker/send-otp-email.tsx`: new send helper using the Resend SDK.
- `apps/app/worker/auth-options.ts`: `EmailOtpOptions` now accepts `sendEmail` callback; Resend fetch logic removed.
- `apps/app/worker/auth.ts`: passes `sendOtpEmail(...)` as the `emailOtpConfig.sendEmail` callback.
- `apps/app/package.json`: `resend` added as a runtime dependency.
- No change to auth flow, routing, UI, or session handling.
- No new environment bindings — same `RESEND_API_KEY` and `RESEND_FROM_EMAIL` as before.

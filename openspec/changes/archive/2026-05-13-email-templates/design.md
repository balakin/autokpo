## Context

The OTP sign-in email was sent from `apps/app/worker/auth-options.ts` via a raw `POST` to `api.resend.com/emails` with a `text:` field. The body was assembled inline: `"Your AutoKPO sign-in code is ${otp}"`. There was no HTML version and no branding.

The goal is to introduce a branded HTML email template and send it via the Resend SDK, with minimal structural change to the rest of the worker.

## Goals / Non-Goals

**Goals:**

- Introduce `apps/app/emails/otp-email.tsx` as a React Email component with AutoKPO branding.
- Send the rendered HTML via the Resend SDK at request time — no build-time export or dashboard upload step.
- Keep `auth-options.ts` transport-agnostic by accepting a `sendEmail` callback.

**Non-Goals:**

- A separate `packages/emails` authoring package.
- Build-time template rendering or Resend saved templates.
- Multi-locale email templates (single language for now).
- Programmatic template deployment scripts.

## Decisions

### 1. Template co-located in `apps/app/emails/`

The React Email component lives inside the app package at `apps/app/emails/otp-email.tsx`. This avoids a separate package and keeps the template adjacent to the worker code that uses it.

_Alternative considered_: a standalone `packages/emails` package. Rejected — adds toolchain overhead (separate `tsconfig`, `turbo.json` outputs, React Email CLI) for a single template. The component is imported directly; no separate build step is needed.

### 2. Resend SDK renders React at request time

`send-otp-email.tsx` uses `new Resend(apiKey)` and `resend.emails.send({ react: <OtpEmail otp={otp} /> })`. The SDK handles JSX → HTML rendering internally.

_Alternative considered_: build-time export to `dist/otp-email.html` with a `{{{OTP}}}` placeholder uploaded as a Resend saved template. Rejected — adds a manual upload step, a new `RESEND_OTP_TEMPLATE_ID` env binding, and risk of template drift between the dashboard and source. Runtime rendering is simpler and keeps everything in source control.

### 3. `sendEmail` callback on `EmailOtpOptions`

`auth-options.ts` accepts `sendEmail: (to: string, otp: string) => Promise<void>` rather than holding Resend credentials directly. The callback is satisfied in `auth.ts` by a closure over `env`.

This makes `auth-options.ts` and its tests transport-agnostic — tests pass a `vi.fn()` stub; production passes the real `sendOtpEmail` helper.

### 4. Resend SDK as a runtime dependency

`resend` is added to `apps/app/package.json` as a runtime dependency. The SDK is edge-compatible and adds no Wrangler compatibility concerns.

_Alternative considered_: keep raw `fetch` and construct the HTML manually. Rejected — the Resend SDK already handles JSX rendering cleanly via its `react` field; duplicating that logic in a raw fetch would be fragile.

### 5. No new environment bindings

`RESEND_API_KEY` and `RESEND_FROM_EMAIL` bindings already existed. No `RESEND_OTP_TEMPLATE_ID` or other new binding is needed.

## Risks / Trade-offs

- **Bundle size**: the `resend` SDK and `react-email` components are added to the worker bundle. Edge bundle size should be checked if it approaches Cloudflare's limits.
- **React Email version updates**: a breaking update to `@react-email/components` could affect the rendered output. Mitigated by the existing build and type-check pipeline.
- **Runtime rendering latency**: JSX → HTML conversion happens on every send. For a low-frequency OTP flow this is negligible.

## Why

OTP sign-in emails are currently rendered only in Serbian (sr-Latn), regardless of the user's preferred locale. Users who have selected English or Russian receive an email in a language they cannot read.

## What Changes

- `emails/otp-email.tsx` is refactored into a pure presentational component: translatable strings move into a single `i18n: { preview, bodyText, footer }` prop object; no Lingui macros inside the template, keeping React Email preview fully functional
- New `worker/i18n.ts` module exports `createI18n(locale)` using `setupI18n` from `@lingui/core` — one fresh instance per request, no shared mutable state
- New `worker/locales/` directory holds `sr-Latn.po`, `en.po`, and `ru.po` for the worker translation catalog
- `worker/send-otp-email.tsx` translates all email strings (subject, body, footer) via `msg` + `i18n._()` before passing them as props to `OtpEmail`
- `worker/auth-options.ts` reads `X-Preferred-Locale` from the Better Auth request context (`ctx.request`) and forwards the locale to `sendOtpEmail`
- `worker/auth.ts` updates the `sendEmail` call signature to include `locale`
- `src/auth/auth-session.ts` adds `fetchOptions.headers['X-Preferred-Locale']` (from `getStoredLocale()`) to the `sendVerificationOtp` call
- `lingui.config.ts` gains a second catalog entry covering `worker/` with output at `worker/locales/{locale}`; both catalog excludes cover `*.spec.ts`/`*.spec.tsx` files and `__tests__/` directories in addition to their respective locale dirs
- `vitest.worker.config.ts` gains the Babel + Lingui plugins so macro transforms run in worker tests
- Pre-commit hook `git add` is extended to also stage `apps/app/worker/locales/`

## Capabilities

### New Capabilities

- `email-i18n`: Worker-side i18n module (`worker/i18n.ts`, `worker/locales/`) providing locale-aware string translation for outgoing emails

### Modified Capabilities

- `email-templates`: `OtpEmail` component API changes — translatable strings move from hardcoded values inside the component to explicit string props supplied by the caller
- `i18n`: Lingui configuration gains a second catalog targeting `worker/` source files with catalog output at `worker/locales/{locale}`

## Impact

- **`apps/app/emails/otp-email.tsx`** — props refactored: `preview`, `bodyText`, `footer` grouped into `i18n` object; Lingui macros removed
- **`apps/app/worker/send-otp-email.tsx`** — new `locale` parameter; translates strings via `createI18n`
- **`apps/app/worker/auth-options.ts`** — reads `X-Preferred-Locale` header from `ctx`; updated `sendEmail` signature
- **`apps/app/worker/auth.ts`** — passes `locale` to `sendOtpEmail`
- **`apps/app/worker/i18n.ts`** — new file
- **`apps/app/worker/locales/*.po`** — new files
- **`apps/app/src/auth/auth-session.ts`** — adds `X-Preferred-Locale` header to OTP request
- **`apps/app/lingui.config.ts`** — second catalog entry
- **`apps/app/vitest.worker.config.ts`** — Babel + Lingui plugins added
- **`.husky/pre-commit`** — extended `git add` for worker locales
- **No new dependencies** — `@lingui/core` and `@lingui/vite-plugin` are already installed

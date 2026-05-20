## 1. Lingui Configuration

- [x] 1.1 Add second catalog entry to `lingui.config.ts` covering `worker/` with path `worker/locales/{locale}` and excluding `worker/locales/**`, `worker/**/__tests__/**`, `worker/**/*.spec.ts`, `worker/**/*.spec.tsx`, `worker/db/**`, `worker/env.d.ts`; update `src/` catalog excludes similarly to cover `src/**/__tests__/**`, `src/**/*.spec.ts`, `src/**/*.spec.tsx`
- [x] 1.2 Add `@rolldown/plugin-babel` with `linguiTransformerBabelPreset` and `@lingui/vite-plugin` to `vitest.worker.config.ts`
- [x] 1.3 Update `.husky/pre-commit` to also stage `apps/app/worker/locales/` after `i18n:extract`

## 2. Worker i18n Module

- [x] 2.1 Create `worker/i18n.ts` exporting `WORKER_LOCALES`, `WorkerLocale` type, and `createI18n(locale: WorkerLocale): I18n` using `setupI18n` from `@lingui/core`
- [x] 2.2 Run `pnpm -s i18n:extract` to generate `worker/locales/sr-Latn.po`, `worker/locales/en.po`, `worker/locales/ru.po` (initially empty catalogs)

## 3. Email Template Refactor

- [x] 3.1 Update `emails/otp-email.tsx` props interface to accept an `i18n: { preview, bodyText, footer }` object in place of hardcoded strings; remove all hardcoded Serbian text from JSX; update `PreviewProps` with hardcoded sr-Latn strings
- [x] 3.2 Update `worker/send-otp-email.tsx` to accept `locale: string`, validate it against `WORKER_LOCALES` (falling back to `'sr-Latn'`), call `createI18n`, translate subject/preview/bodyText/footer via `i18n._(msg\`...\`)`, and pass translated props to `OtpEmail`

## 4. Locale Header Plumbing

- [x] 4.1 Update `worker/auth-options.ts`: `sendVerificationOTP` callback reads `ctx?.request?.headers.get('X-Preferred-Locale')` and passes it to `emailOtpConfig.sendEmail`; update `EmailOtpOptions.sendEmail` signature to include `locale: string`
- [x] 4.2 Update `worker/auth.ts` to pass `locale` in the `sendEmail` call to `sendOtpEmail`
- [x] 4.3 Update `src/auth/auth-session.ts` `requestEmailOtpSession` to add `fetchOptions: { headers: { 'X-Preferred-Locale': getStoredLocale() } }` to the `sendVerificationOtp` call

## 5. Translations

- [x] 5.1 Fill in English (`en`) translations in `worker/locales/en.po`
- [x] 5.2 Fill in Russian (`ru`) translations in `worker/locales/ru.po`

## 6. Verification

- [x] 6.1 Run `cd apps/app && pnpm -s test --reporter=verbose worker/__tests__/email-otp-auth.spec.ts` and confirm all tests pass
- [x] 6.2 Run `cd apps/app && pnpm -s build 2>&1 | grep -E 'error TS|error:'` and confirm no type errors

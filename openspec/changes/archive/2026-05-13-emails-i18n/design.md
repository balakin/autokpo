## Context

The OTP email is rendered server-side inside a Cloudflare Worker using `react-email` and delivered via Resend. Currently `OtpEmail` has all strings hardcoded in Serbian. The worker already uses Vite (via `@cloudflare/vite-plugin`), so the `@lingui/vite-plugin` transform pipeline is available there — `.po` file imports work the same way as in the frontend.

The frontend stores the user's preferred locale under `autokpo:locale` in `localStorage`. Better Auth's email OTP client supports per-call `fetchOptions.headers`, and the server-side `sendVerificationOTP` callback receives the raw `Request` via its second argument (`ctx.request`), making it possible to read a custom header without patching Better Auth.

## Goals / Non-Goals

**Goals:**

- OTP emails are delivered in the user's preferred locale (`sr-Latn`, `en`, `ru`)
- No Lingui React context inside `emails/otp-email.tsx` so React Email preview continues to work unchanged
- No shared mutable i18n state in the worker (safe under concurrent requests)
- Catalog extraction for worker strings mirrors the existing `src/` pattern

**Non-Goals:**

- Translating emails sent by social OAuth providers
- Dynamic locale detection from `Accept-Language` (user's explicit app preference is used instead)
- Locale fallback logic beyond defaulting to `sr-Latn` when the header is absent or unrecognised

## Decisions

### 1. Pre-translated props instead of Lingui context in the email template

The `OtpEmail` component receives all user-visible strings grouped under a single `i18n: { preview, bodyText, footer }` prop. Translation happens in `send-otp-email.tsx` before `resend.emails.send` is called. The template contains no Lingui macros and requires no `I18nProvider`.

**Why**: `<Trans>` in Lingui v6 throws in development mode when no `I18nProvider` is present. React Email's preview server renders components directly (no custom wrapper), so any Lingui context dependency would crash previews. Passing pre-translated strings keeps the template a pure, zero-dependency presentational component.

**Alternative considered**: Wrap `OtpEmail` internally with `I18nProvider` accepting a `locale` prop. Rejected because it couples the template to Lingui internals, complicates preview setup, and is unnecessary given the single-caller context.

### 2. `setupI18n` per request, not a shared singleton

`worker/i18n.ts` exports `createI18n(locale: WorkerLocale)` which calls `setupI18n({ locale, messages: allMessages })` and returns a fresh `I18n` instance. The compiled locale messages are module-level constants (loaded once at cold start).

**Why**: Cloudflare Workers are single-threaded but cooperative — `await` points yield to other requests. A shared singleton activated with `i18n.activate(locale)` would be race-prone if any translation step were async. `setupI18n` returns an independent instance with no shared state.

**Alternative considered**: Shared singleton + synchronous translate-before-await pattern (safe as long as all `i18n._()` calls precede the first `await`). Rejected because the correctness depends on call-order discipline that is invisible to future readers and easy to break.

### 3. `X-Preferred-Locale` custom header for locale propagation

`src/auth/auth-session.ts` adds `fetchOptions: { headers: { 'X-Preferred-Locale': getStoredLocale() } }` to the `sendVerificationOtp` call. `worker/auth-options.ts` reads the header from `ctx.request` (the second argument to `sendVerificationOTP`).

**Why**: Better Auth's `emailOTP` plugin passes the raw `Request` as `ctx.request` to `sendVerificationOTP`. Per-call `fetchOptions.headers` is a documented pattern in Better Auth (used by the captcha plugin). This avoids any modification to Better Auth configuration or the DB schema.

**Alternative considered**: Pass locale as part of the email field or a separate body field. Rejected because Better Auth validates the request body strictly (Zod schema, only `email` + `type` allowed); adding undeclared fields would be fragile.

### 4. Worker-scoped Lingui catalog at `worker/locales/`

A second catalog entry in `lingui.config.ts` covers `worker/` source files and writes PO files to `worker/locales/{locale}`. The subject line and all email body strings live in `worker/send-otp-email.tsx` and are extracted there.

**Why**: Keeping worker strings in `worker/locales/` mirrors the `src/locales/` convention, makes the scope of each catalog obvious, and avoids mixing worker and frontend message IDs.

**Alternative considered**: Single catalog covering both `src/` and `worker/`. Rejected because it merges unrelated string sets, making catalog diffs harder to review and extraction noisier.

### 5. Babel + Lingui plugins added to `vitest.worker.config.ts`

`vitest.worker.config.ts` does not inherit from `vite.config.ts` (unlike `vitest.app.config.ts`). The `@rolldown/plugin-babel` with `linguiTransformerBabelPreset` and `@lingui/vite-plugin` must be added explicitly.

**Why**: Without the macro transform, `msg\`...\``calls in worker source files are not expanded at test time, causing runtime errors in worker tests that import`send-otp-email.tsx`.

## Risks / Trade-offs

- **Header spoofing** → Any client can send an arbitrary `X-Preferred-Locale`. Mitigation: the header value is validated against the `WORKER_LOCALES` allowlist; unrecognised values fall back to `sr-Latn`. The locale controls only the language of a transactional email, not any security-sensitive behaviour.
- **React Email preview shows sr-Latn only** → Props-based design means `PreviewProps` uses hardcoded Serbian strings. Acceptable: preview is a developer tool, not a stakeholder deliverable.
- **Worker cold-start includes all locale message data** → All three PO files are imported unconditionally at module load. For the small number of email strings this has negligible size impact.

## Open Questions

None — design is fully resolved from the exploration session.

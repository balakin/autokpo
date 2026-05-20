## ADDED Requirements

### Requirement: Worker exposes a locale-aware i18n factory

The worker SHALL provide a `createI18n(locale: WorkerLocale)` function in `worker/i18n.ts` that returns a fresh `I18n` instance (via `setupI18n` from `@lingui/core`) pre-loaded with messages for all supported locales and activated for the requested locale. `WorkerLocale` SHALL be the union `'sr-Latn' | 'en' | 'ru'`. Compiled locale messages SHALL be imported from `worker/locales/{locale}.po` as module-level constants so they are loaded once at cold start and shared across instances.

#### Scenario: Factory returns an activated instance for a known locale

- **WHEN** `createI18n('en')` is called
- **THEN** the returned `I18n` instance SHALL translate messages using the `en` catalog
- **AND** each call SHALL return a distinct instance with no shared mutable state

#### Scenario: Factory accepts all supported locales

- **WHEN** `createI18n` is called with `'sr-Latn'`, `'en'`, or `'ru'`
- **THEN** a valid activated `I18n` instance SHALL be returned in each case

### Requirement: Worker translation catalog covers worker source files

The system SHALL maintain a Lingui PO catalog at `apps/app/worker/locales/{locale}.po` for `sr-Latn`, `en`, and `ru`. The catalog SHALL be extracted from `worker/` source files (excluding `worker/locales/`, `worker/**/__tests__/`, `worker/**/*.spec.ts`, `worker/**/*.spec.tsx`, `worker/db/`, and `worker/env.d.ts`). Running `pnpm i18n:extract` SHALL update this catalog alongside the existing `src/locales/` catalog. The pre-commit hook SHALL also stage `apps/app/worker/locales/` after extraction.

#### Scenario: Extraction populates the worker catalog

- **WHEN** `pnpm i18n:extract` is run
- **THEN** `worker/locales/sr-Latn.po`, `worker/locales/en.po`, and `worker/locales/ru.po` SHALL be created or updated with message IDs extracted from `worker/` source files

#### Scenario: Missing worker translations fail the build

- **WHEN** a worker locale PO file has an empty `msgstr` for a message
- **THEN** `@lingui/vite-plugin` with `failOnMissing: true` SHALL fail the build

### Requirement: Preferred locale is forwarded from client to worker via request header

When requesting an OTP, the client SHALL include an `X-Preferred-Locale` header carrying the value of `getStoredLocale()` from `localStorage`. The worker SHALL read this header inside the `sendVerificationOTP` callback via `ctx.request.headers.get('X-Preferred-Locale')`. Values not in `WORKER_LOCALES` SHALL fall back to `'sr-Latn'`.

#### Scenario: Client sends preferred locale header with OTP request

- **WHEN** a user submits their email address to request a sign-in OTP
- **THEN** the HTTP request to `/api/auth/email-otp/send-verification-otp` SHALL include `X-Preferred-Locale: <stored-locale>`

#### Scenario: Worker reads locale from header and sends localised email

- **WHEN** the worker handles the OTP request and `X-Preferred-Locale` is `'en'`
- **THEN** the OTP email SHALL be rendered and sent in English

#### Scenario: Missing or unrecognised locale header falls back to sr-Latn

- **WHEN** `X-Preferred-Locale` is absent or contains a value not in `['sr-Latn', 'en', 'ru']`
- **THEN** the OTP email SHALL be sent in `sr-Latn`

## MODIFIED Requirements

### Requirement: OTP sign-in email template lives inside the app

The app SHALL contain a React Email OTP sign-in template at `apps/app/emails/otp-email.tsx`. The component SHALL accept `otp: string` and `i18n: { preview: string; bodyText: string; footer: string }` props and render a branded HTML email styled with the app's Nordic Winter light theme. The component SHALL NOT contain any Lingui macros or depend on `I18nProvider` — all translatable strings SHALL be passed in via the `i18n` prop. A `sendOtpEmail` helper in `apps/app/worker/send-otp-email.tsx` SHALL translate all strings using a locale-specific `I18n` instance (from `createI18n`), construct the email subject via `i18n._(msg\`...\`)`, and call `resend.emails.send({ subject, react: <OtpEmail otp={otp} i18n={{ preview, bodyText, footer }} /> })` to deliver the email.

#### Scenario: Valid OTP request delivers a localised branded email

- **WHEN** a signed-out user submits an email address to request a sign-in code
- **THEN** the worker SHALL translate the subject, preview, body text, and footer into the user's preferred locale
- **AND** SHALL render `OtpEmail` with the translated strings and the generated code
- **AND** SHALL send it via `resend.emails.send`
- **AND** the recipient SHALL receive an HTML email displaying the sign-in code in their preferred locale

#### Scenario: Send failure propagates as an error

- **WHEN** the Resend API returns an error
- **THEN** `sendOtpEmail` SHALL throw, causing the Better Auth request to fail

#### Scenario: React Email preview renders without i18n context

- **WHEN** the React Email preview server renders `OtpEmail` using `PreviewProps`
- **THEN** the component SHALL render successfully with the hardcoded sr-Latn preview strings
- **AND** SHALL NOT require an `I18nProvider` in the component tree

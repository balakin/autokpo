## ADDED Requirements

### Requirement: Account-deleted email template lives inside the app

The app SHALL contain a React Email account-deleted template under `apps/app/emails/`. The component SHALL accept localized strings through an `i18n` prop, render a branded HTML email styled consistently with the OTP email template, and SHALL NOT contain Lingui macros or depend on `I18nProvider`.

#### Scenario: Account-deleted template renders localized copy

- **WHEN** the worker renders the account-deleted email template with localized strings
- **THEN** the email SHALL display a concise message that the AutoKPO account and synchronized data associated with the email address were permanently removed
- **AND** it SHALL use the same visual theme style as the OTP email

#### Scenario: React Email preview renders without i18n context

- **WHEN** the React Email preview server renders the account-deleted template using `PreviewProps`
- **THEN** the component SHALL render successfully with hardcoded sr-Latn preview strings
- **AND** SHALL NOT require an `I18nProvider` in the component tree

### Requirement: Worker sends account-deleted email through Resend

The worker SHALL provide an account-deleted email sender that translates subject, preview, and body copy with `createI18n`, renders the account-deleted React Email template, and sends it through Resend.

#### Scenario: Account deletion delivers branded email

- **WHEN** Better Auth completes deletion for a user with an email address
- **THEN** the worker SHALL send a localized branded account-deleted email through Resend

#### Scenario: Send failure propagates as an error

- **WHEN** the Resend API returns an error while sending the account-deleted email
- **THEN** the account-deleted sender SHALL throw an error
